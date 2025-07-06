import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { InsertEmail } from '@shared/schema';

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private config: EmailServiceConfig;

  constructor() {
    this.config = {
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: process.env.GMAIL_EMAIL || '',
        pass: process.env.GMAIL_APP_PASSWORD || '',
      },
    };
  }

  async fetchRecentEmails(count: number = 10): Promise<InsertEmail[]> {
    if (!this.config.auth.user || !this.config.auth.pass) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables.');
    }

    let client: ImapFlow | null = null;
    
    try {
      client = new ImapFlow(this.config);
      await client.connect();
      
      // Select INBOX
      await client.mailboxOpen('INBOX');
      
      // Search for recent emails
      const messages = client.fetch(
        { seen: false, since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        {
          envelope: true,
          source: true,
        },
        { changedSince: BigInt(0) }
      );

      const emails: InsertEmail[] = [];
      let processed = 0;

      for await (const message of messages) {
        if (processed >= count) break;

        try {
          const parsed = await simpleParser(message.source);
          
          const email: InsertEmail = {
            subject: parsed.subject || 'No Subject',
            sender: parsed.from?.text || 'Unknown Sender',
            senderEmail: parsed.from?.value?.[0]?.address || '',
            date: parsed.date || new Date(),
            body: parsed.text || parsed.html || '',
            category: this.categorizeEmail(
              parsed.subject || '',
              parsed.text || parsed.html || '',
              parsed.from?.text || ''
            ),
            messageId: parsed.messageId || `${Date.now()}-${processed}`,
          };

          emails.push(email);
          processed++;
        } catch (parseError) {
          console.error('Error parsing email:', parseError);
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (client) {
        try {
          await client.logout();
        } catch (logoutError) {
          console.error('Error during logout:', logoutError);
        }
      }
    }
  }

  private categorizeEmail(subject: string, body: string, sender: string): string {
    const content = `${subject} ${body} ${sender}`.toLowerCase();

    // FYI keywords - newsletters, confirmations, updates
    const fyiKeywords = [
      'newsletter', 'confirmation', 'confirmed', 'update', 'notification',
      'noreply', 'no-reply', 'automated', 'system', 'alert', 'digest',
      'weekly', 'monthly', 'daily', 'subscription', 'unsubscribe',
      'receipt', 'invoice', 'billing', 'payment', 'order', 'shipping'
    ];

    // Forward keywords - mentions other people, delegation
    const forwardKeywords = [
      'team', 'group', 'cc:', 'fwd:', 'forward', 'please forward',
      'share with', 'send to', 'copy', 'distribute', 'broadcast',
      'for your team', 'for the team', 'feedback for', 'question for'
    ];

    // Draft keywords - action required, urgent, questions
    const draftKeywords = [
      'urgent', 'asap', 'deadline', 'review', 'approve', 'approval',
      'action required', 'please', 'could you', 'can you', 'need',
      'request', 'follow up', 'follow-up', 'response required',
      'meeting', 'schedule', 'calendar', 'reschedule', 'confirm',
      'question', 'help', 'assistance', 'clarification'
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

  async testConnection(): Promise<boolean> {
    try {
      const client = new ImapFlow(this.config);
      await client.connect();
      await client.logout();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
