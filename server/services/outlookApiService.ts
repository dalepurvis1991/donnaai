import type { InsertEmail, User } from '@shared/schema';

export class OutlookApiService {
    private async getAccessToken(user: User): Promise<string> {
        if (!user.microsoftAccessToken) {
            throw new Error('User has no Microsoft access token');
        }
        // In a real app, we'd check expiration and use refresh token if needed.
        // For now, we assume it's valid or handled by the auth layer.
        return user.microsoftAccessToken;
    }

    async fetchUserEmails(user: User, count: number = 100): Promise<InsertEmail[]> {
        try {
            const accessToken = await this.getAccessToken(user);

            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/messages?$top=${count}&$select=id,subject,from,receivedDateTime,bodyPreview,body,conversationId`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Prefer': 'outlook.body-content-type="text"'
                    }
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Microsoft Graph API error: ${JSON.stringify(error)}`);
            }

            const data = await response.json();
            const messages = data.value || [];
            const emails: InsertEmail[] = [];

            for (const message of messages) {
                const email = await this.parseOutlookMessage(message, user.id);
                if (email) {
                    emails.push(email);
                }
            }

            return emails;
        } catch (error: any) {
            console.error('Outlook API error:', error);
            throw new Error(`Failed to fetch Outlook emails: ${error.message}`);
        }
    }

    private async parseOutlookMessage(message: any, userId: string): Promise<InsertEmail | null> {
        try {
            const subject = message.subject || 'No Subject';
            const from = message.from?.emailAddress?.name || message.from?.emailAddress?.address || 'Unknown Sender';
            const senderEmail = message.from?.emailAddress?.address || 'Unknown Sender';
            const date = message.receivedDateTime || new Date().toISOString();
            const messageId = message.id;
            const body = message.body?.content || message.bodyPreview || '';

            // Categorize the email using AI
            const category = await this.categorizeEmail(subject, body, from, senderEmail);

            return {
                userId,
                subject,
                sender: from,
                senderEmail,
                date: new Date(date),
                body,
                category,
                messageId: `outlook-${messageId}`,
                threadId: message.conversationId,
                provider: 'microsoft',
                folder: 'inbox' // Default for now
            };
        } catch (error) {
            console.error('Error parsing Outlook message:', error);
            return null;
        }
    }

    private async categorizeEmail(subject: string, body: string, sender: string, senderEmail: string): Promise<string> {
        const { openaiService } = await import('./openaiService');

        try {
            const result = await openaiService.categorizeEmail(subject, body, sender, senderEmail);
            return result.category;
        } catch (error) {
            console.error('AI categorization failed for Outlook email:', error);
            return 'Draft'; // Default fallback
        }
    }

    async testConnection(user: User): Promise<boolean> {
        if (!user.microsoftAccessToken) return false;

        try {
            const accessToken = await this.getAccessToken(user);
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            return response.ok;
        } catch (error) {
            console.error('Outlook connection test failed:', error);
            return false;
        }
    }
}

export const outlookApiService = new OutlookApiService();
