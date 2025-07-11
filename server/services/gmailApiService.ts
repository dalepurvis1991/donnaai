import { google } from 'googleapis';
import type { InsertEmail, User } from '@shared/schema';

export class GmailApiService {
  async fetchUserEmails(user: User, count: number = 100): Promise<InsertEmail[]> {
    if (!user.googleAccessToken) {
      throw new Error('User has no Google access token');
    }

    try {
      console.log('Gmail API Service - Environment check:', {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        clientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
        secretLength: process.env.GOOGLE_CLIENT_SECRET?.length,
        userHasAccessToken: !!user.googleAccessToken,
        userHasRefreshToken: !!user.googleRefreshToken
      });
      
      // Set up OAuth2 client with user's tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://baron-inbox-dalepurvis.replit.app/api/auth/google/callback'
      );
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Get list of recent emails
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: count,
        q: 'in:inbox', // Only inbox emails
      });

      const messages = response.data.messages || [];
      const emails: InsertEmail[] = [];

      // Fetch details for each email
      for (const message of messages) {
        if (!message.id) continue;

        try {
          const emailDetail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });

          const email = await this.parseGmailMessage(emailDetail.data);
          if (email) {
            emails.push(email);
          }
        } catch (error) {
          console.error(`Failed to fetch email ${message.id}:`, error);
          continue;
        }
      }

      return emails;
    } catch (error: any) {
      console.error('Gmail API error:', error);
      if (error.code === 401) {
        throw new Error('Gmail access token expired. Please re-authenticate.');
      }
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }
  }

  private async parseGmailMessage(message: any): Promise<InsertEmail | null> {
    try {
      const headers = message.payload?.headers || [];
      
      const subject = this.findHeader(headers, 'Subject') || 'No Subject';
      const from = this.findHeader(headers, 'From') || 'Unknown Sender';
      const date = this.findHeader(headers, 'Date') || new Date().toISOString();
      const messageId = this.findHeader(headers, 'Message-ID') || `gmail-${message.id}`;

      // Extract sender name and email
      let sender = from;
      let senderEmail = from;
      
      const emailMatch = from.match(/<(.+?)>/);
      if (emailMatch) {
        senderEmail = emailMatch[1];
        sender = from.replace(/<.+?>/, '').trim().replace(/['"]/g, '');
      } else if (from.includes('@')) {
        senderEmail = from;
        sender = from.split('@')[0];
      }

      // Get email body
      let body = '';
      if (message.payload?.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body += Buffer.from(part.body.data, 'base64').toString();
          }
        }
      } else if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString();
      }

      // Categorize the email using AI
      const category = await this.categorizeEmail(subject, body, sender, senderEmail);

      return {
        subject,
        sender,
        senderEmail,
        date: new Date(date),
        body: body.substring(0, 1000), // Limit body size
        category,
        messageId,
      };
    } catch (error) {
      console.error('Error parsing Gmail message:', error);
      return null;
    }
  }

  private findHeader(headers: any[], name: string): string | undefined {
    const header = headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value;
  }

  private async categorizeEmail(subject: string, body: string, sender: string, senderEmail: string): Promise<string> {
    // Import dynamically to avoid circular dependencies
    const { openaiService } = await import('./openaiService');
    
    try {
      const result = await openaiService.categorizeEmail(subject, body, sender, senderEmail);
      console.log(`Email categorized as ${result.category} (confidence: ${result.confidence}): ${result.reasoning}`);
      return result.category;
    } catch (error) {
      console.error('AI categorization failed, using fallback:', error);
      return this.fallbackCategorization(subject, body, sender);
    }
  }

  private fallbackCategorization(subject: string, body: string, sender: string): string {
    const content = `${subject} ${body} ${sender}`.toLowerCase();

    // Keywords for each category
    const fyiKeywords = [
      'newsletter', 'update', 'announcement', 'info', 'fyi', 'notification',
      'summary', 'report', 'news', 'weekly', 'monthly', 'digest'
    ];

    const draftKeywords = [
      'urgent', 'asap', 'deadline', 'action required', 'please review',
      'need', 'request', 'approve', 'confirm', 'respond', 'reply',
      'meeting', 'call', 'schedule', 'task', 'todo'
    ];

    const forwardKeywords = [
      'team', 'share', 'forward', 'cc:', 'bcc:', 'distribute',
      'please share', 'fwd:', 're:', 'all team', 'everyone'
    ];

    // Check for Forward first (might contain team mentions)
    if (forwardKeywords.some(keyword => content.includes(keyword))) {
      return 'Forward';
    }

    // Check for Draft (action required)
    if (draftKeywords.some(keyword => content.includes(keyword))) {
      return 'Draft';
    }

    // Check for FYI (informational)
    if (fyiKeywords.some(keyword => content.includes(keyword))) {
      return 'FYI';
    }

    // Default to Draft for emails that don't match clear patterns
    return 'Draft';
  }

  async testConnection(user: User): Promise<boolean> {
    if (!user.googleAccessToken) {
      return false;
    }

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Test by getting user profile
      await gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      console.error('Gmail API connection test failed:', error);
      return false;
    }
  }

  async fetchEmailsInBatch(user: User, limit: number = 1000): Promise<InsertEmail[]> {
    try {
      const gmail = this.getGmailClient(user);
      
      // Get list of messages with higher limit
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: limit,
        q: 'in:inbox OR in:sent -in:spam -in:trash'
      });

      const messages = listResponse.data.messages || [];
      const emails: InsertEmail[] = [];

      // Process messages in batches of 10 to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (message) => {
          try {
            return await this.getEmailDetails(gmail, message.id!);
          } catch (error) {
            console.error(`Error fetching email ${message.id}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        emails.push(...batchResults.filter(Boolean) as InsertEmail[]);
        
        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails in batch:', error);
      throw error;
    }
  }
}

export const gmailApiService = new GmailApiService();