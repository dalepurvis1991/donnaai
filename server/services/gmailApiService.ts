import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { InsertEmail, User } from '@shared/schema';

export class GmailApiService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI || 'http://localhost:5000/auth/callback'
    );
  }

  async fetchUserEmails(user: User, count: number = 10): Promise<InsertEmail[]> {
    if (!user.googleAccessToken) {
      throw new Error('User does not have Google access token');
    }

    // Set the user's credentials
    this.oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      // Get list of recent messages
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: count,
        q: 'in:inbox',
      });

      const messages = listResponse.data.messages || [];
      const emails: InsertEmail[] = [];

      // Fetch details for each message
      for (const message of messages) {
        if (!message.id) continue;

        try {
          const messageDetails = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });

          const email = this.parseGmailMessage(messageDetails.data);
          if (email) {
            emails.push(email);
          }
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          continue;
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails from Gmail API:', error);
      
      // If token is expired, try to refresh
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Authentication token expired. Please log in again.');
      }
      
      throw error;
    }
  }

  private parseGmailMessage(message: any): InsertEmail | null {
    const headers = message.payload?.headers || [];
    const subject = this.findHeader(headers, 'Subject') || 'No Subject';
    const from = this.findHeader(headers, 'From') || 'Unknown Sender';
    const date = this.findHeader(headers, 'Date') || new Date().toISOString();
    const messageId = this.findHeader(headers, 'Message-ID') || `gmail-${message.id}`;

    // Parse sender name and email
    const senderMatch = from.match(/^(.*?)\s*<(.+?)>$/) || from.match(/^(.+)$/);
    const senderName = senderMatch ? senderMatch[1]?.trim() || senderMatch[0]?.trim() : 'Unknown';
    const senderEmail = senderMatch && senderMatch[2] ? senderMatch[2].trim() : from;

    // Extract body text
    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload?.parts) {
      // Try to find text/plain part
      const textPart = message.payload.parts.find((part: any) => 
        part.mimeType === 'text/plain'
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    // Categorize email based on subject and content
    const category = this.categorizeEmail(subject, body, senderName);

    return {
      subject,
      sender: senderName,
      senderEmail,
      date: new Date(date),
      body: body.substring(0, 1000), // Limit body length
      category,
      messageId,
    };
  }

  private findHeader(headers: any[], name: string): string | undefined {
    const header = headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value;
  }

  private categorizeEmail(subject: string, body: string, sender: string): string {
    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();
    const senderLower = sender.toLowerCase();

    // Draft category - emails requiring action
    if (
      subjectLower.includes('urgent') ||
      subjectLower.includes('action required') ||
      subjectLower.includes('deadline') ||
      subjectLower.includes('please review') ||
      subjectLower.includes('meeting request') ||
      subjectLower.includes('approval') ||
      bodyLower.includes('please respond') ||
      bodyLower.includes('by tomorrow') ||
      bodyLower.includes('asap')
    ) {
      return 'Draft';
    }

    // Forward category - emails to share
    if (
      subjectLower.includes('fwd:') ||
      subjectLower.includes('forward') ||
      subjectLower.includes('share with') ||
      subjectLower.includes('team update') ||
      subjectLower.includes('announcement') ||
      bodyLower.includes('please forward') ||
      bodyLower.includes('share this')
    ) {
      return 'Forward';
    }

    // FYI category - informational emails (default)
    return 'FYI';
  }

  async testConnection(user: User): Promise<boolean> {
    if (!user.googleAccessToken) {
      return false;
    }

    try {
      this.oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }
}

export const gmailApiService = new GmailApiService();