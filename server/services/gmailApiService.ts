import { storage } from '../storage';

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

      // Fetch user preferences for category mapping
      const prefs = await storage.getUserPreferences(user.id);
      const categoryMapping = prefs?.categoryMapping as { draft: string; fyi: string; forward: string } | undefined;

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

          const email = await this.parseGmailMessage(emailDetail.data, user.id, categoryMapping);
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

  private async parseGmailMessage(message: any, userId: string, categoryMapping?: { draft: string; fyi: string; forward: string }): Promise<InsertEmail | null> {
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

      // Get email body with recursive parsing
      const body = this.extractEmailBody(message.payload) || message.snippet || '';

      // Categorize the email using AI
      const category = await this.categorizeEmail(subject, body, sender, senderEmail, categoryMapping);

      return {
        userId,
        subject,
        sender,
        senderEmail,
        date: new Date(date),
        body, // Use the extracted body or snippet
        category,
        messageId,
        threadId: message.threadId,
      };
    } catch (error) {
      console.error('Error parsing Gmail message:', error);
      return null;
    }
  }

  private extractEmailBody(payload: any): string {
    if (!payload) return '';

    // If it's a multipart message, recursively check parts
    if (payload.parts) {
      let body = '';
      // Prioritize text/plain
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString();
        }
      }

      // If no plain text, try text/html
      if (!body) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            const html = Buffer.from(part.body.data, 'base64').toString();
            // Basic HTML to text conversion (removing tags)
            body += html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
      }

      // If still no body, recurse deeper
      if (!body) {
        for (const part of payload.parts) {
          body += this.extractEmailBody(part);
          if (body) break;
        }
      }

      return body;
    }

    // Single part message
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    return '';
  }

  private findHeader(headers: any[], name: string): string | undefined {
    const header = headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value;
  }

  private async categorizeEmail(subject: string, body: string, sender: string, senderEmail: string, categoryMapping?: { draft: string; fyi: string; forward: string }): Promise<string> {
    // Import dynamically to avoid circular dependencies
    const { openaiService } = await import('./openaiService');

    try {
      const result = await openaiService.categorizeEmail(subject, body, sender, senderEmail, categoryMapping);
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

  private getGmailClient(user: User) {
    if (!user.googleAccessToken) {
      throw new Error('User has no Google access token');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://baron-inbox-dalepurvis.replit.app/api/auth/google/callback'
    );
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async fetchEmailsInBatch(user: User, limit: number = 1000): Promise<InsertEmail[]> {
    try {
      const gmail = this.getGmailClient(user);

      // Fetch user preferences for category mapping
      const prefs = await storage.getUserPreferences(user.id);
      const categoryMapping = prefs?.categoryMapping as { draft: string; fyi: string; forward: string } | undefined;

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
            const emailDetail = await gmail.users.messages.get({
              userId: 'me',
              id: message.id!,
              format: 'full',
            });
            return await this.parseGmailMessage(emailDetail.data, user.id, categoryMapping);
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
  async fetchEmailsPage(user: User, pageSize: number, pageToken?: string): Promise<{ emails: InsertEmail[], nextPageToken: string | null }> {
    try {
      const gmail = this.getGmailClient(user);

      // Fetch user preferences for category mapping
      const prefs = await storage.getUserPreferences(user.id);
      const categoryMapping = prefs?.categoryMapping as { draft: string; fyi: string; forward: string } | undefined;

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: pageSize,
        pageToken: pageToken,
        q: 'in:inbox OR in:sent -in:spam -in:trash'
      });

      const messages = response.data.messages || [];
      const nextPageToken = response.data.nextPageToken || null;
      const emails: InsertEmail[] = [];

      // Process batch in parallel
      const promises = messages.map(async (message) => {
        if (!message.id) return null;
        try {
          const emailDetail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });
          return await this.parseGmailMessage(emailDetail.data, user.id, categoryMapping);
        } catch (error) {
          console.error(`Error fetching email ${message.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      emails.push(...results.filter((e): e is InsertEmail => e !== null));

      return { emails, nextPageToken: nextPageToken || null };
    } catch (error) {
      console.error('Error fetching emails page:', error);
      throw error;
    }
  }

  async sendEmail(user: User, to: string, subject: string, body: string): Promise<string> {
    try {
      const gmail = this.getGmailClient(user);

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        body
      ];

      const message = messageParts.join('\n');

      // The body needs to be base64url encoded.
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(`Email sent to ${to}, ID: ${res.data.id}`);
      return res.data.id || '';
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }
}

export const gmailApiService = new GmailApiService();