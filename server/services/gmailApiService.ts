import { google } from 'googleapis';
import type { InsertEmail, User } from '@shared/schema';

export class GmailApiService {
  async fetchUserEmails(user: User, count: number = 10): Promise<InsertEmail[]> {
    if (!user.googleAccessToken) {
      throw new Error('User has no Google access token');
    }

    try {
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

          const email = this.parseGmailMessage(emailDetail.data);
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

  private parseGmailMessage(message: any): InsertEmail | null {
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

      // Categorize the email
      const category = this.categorizeEmail(subject, body, sender);

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

  private categorizeEmail(subject: string, body: string, sender: string): string {
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
}

export const gmailApiService = new GmailApiService();