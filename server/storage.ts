import { emails, type Email, type InsertEmail } from "@shared/schema";

export interface IStorage {
  getEmails(): Promise<Email[]>;
  getEmailsByCategory(category: string): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  clearEmails(): Promise<void>;
  getEmailStats(): Promise<{
    totalEmails: number;
    fyiCount: number;
    draftCount: number;
    forwardCount: number;
    lastUpdated: string;
  }>;
}

export class MemStorage implements IStorage {
  private emails: Map<number, Email>;
  private currentId: number;
  private lastUpdated: Date;

  constructor() {
    this.emails = new Map();
    this.currentId = 1;
    this.lastUpdated = new Date();
  }

  async getEmails(): Promise<Email[]> {
    return Array.from(this.emails.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getEmailsByCategory(category: string): Promise<Email[]> {
    return Array.from(this.emails.values())
      .filter(email => email.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.currentId++;
    const email: Email = { 
      ...insertEmail, 
      id,
      body: insertEmail.body ?? null 
    };
    this.emails.set(id, email);
    this.lastUpdated = new Date();
    return email;
  }

  async clearEmails(): Promise<void> {
    this.emails.clear();
    this.lastUpdated = new Date();
  }

  async getEmailStats() {
    const allEmails = Array.from(this.emails.values());
    const fyiCount = allEmails.filter(e => e.category === 'FYI').length;
    const draftCount = allEmails.filter(e => e.category === 'Draft').length;
    const forwardCount = allEmails.filter(e => e.category === 'Forward').length;
    
    return {
      totalEmails: allEmails.length,
      fyiCount,
      draftCount,
      forwardCount,
      lastUpdated: this.getTimeAgo(this.lastUpdated),
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }
}

export const storage = new MemStorage();
