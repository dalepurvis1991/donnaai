import { emails, calendarEvents, users, userSettings, chatMessages, type Email, type InsertEmail, type CalendarEvent, type InsertCalendarEvent, type User, type UpsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Email operations
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
  
  // Calendar operations
  getCalendarEvents(userId: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  clearCalendarEvents(userId: string): Promise<void>;
  
  // User operations for Google OAuth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Settings operations
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<any>;
  
  // Chat operations
  getChatMessages(userId: string): Promise<any[]>;
  createChatMessage(message: any): Promise<any>;
  
  // Email details and management
  getEmailById(id: number): Promise<any>;
  updateEmailCategory(id: number, category: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private emails: Map<number, Email>;
  private users: Map<string, User>;
  private currentId: number;
  private lastUpdated: Date;

  constructor() {
    this.emails = new Map();
    this.users = new Map();
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

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const user: User = {
      id: userData.id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      googleAccessToken: userData.googleAccessToken ?? null,
      googleRefreshToken: userData.googleRefreshToken ?? null,
      createdAt: userData.createdAt ?? now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
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

export class DatabaseStorage implements IStorage {
  async getEmails(): Promise<Email[]> {
    return await db.select().from(emails).orderBy(emails.date);
  }

  async getEmailsByCategory(category: string): Promise<Email[]> {
    return await db.select().from(emails)
      .where(eq(emails.category, category))
      .orderBy(emails.date);
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db.insert(emails).values(insertEmail).returning();
    return email;
  }

  async clearEmails(): Promise<void> {
    await db.delete(emails);
  }

  async getEmailStats() {
    const allEmails = await this.getEmails();
    const fyiCount = allEmails.filter(email => email.category === 'FYI').length;
    const draftCount = allEmails.filter(email => email.category === 'Draft').length;
    const forwardCount = allEmails.filter(email => email.category === 'Forward').length;
    
    return {
      totalEmails: allEmails.length,
      fyiCount,
      draftCount,
      forwardCount,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Calendar operations
  async getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId))
      .orderBy(calendarEvents.startDateTime);
  }

  async createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db
      .insert(calendarEvents)
      .values(eventData)
      .onConflictDoUpdate({
        target: calendarEvents.id,
        set: eventData,
      })
      .returning();
    return event;
  }

  async clearCalendarEvents(userId: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.userId, userId));
  }

  // Settings operations
  async getUserSettings(userId: string): Promise<any> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (!settings) {
      // Create default settings
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          id: `settings-${userId}`,
          userId,
          emailRules: {
            senderRules: [],
            subjectRules: [],
            generalPreferences: {
              prioritizePersonal: false,
              autoForwardCustomerService: true,
              treatNewslettersAsFYI: true,
            },
          },
        })
        .returning();
      return newSettings;
    }
    return settings;
  }

  async updateUserSettings(userId: string, settings: any): Promise<any> {
    const [updated] = await db
      .update(userSettings)
      .set({
        emailRules: settings.emailRules,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  }

  // Chat operations
  async getChatMessages(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: any): Promise<any> {
    const [created] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return created;
  }

  // Email details and management
  async getEmailById(id: number): Promise<any> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email;
  }

  async updateEmailCategory(id: number, category: string): Promise<any> {
    const [updated] = await db
      .update(emails)
      .set({ category })
      .where(eq(emails.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
