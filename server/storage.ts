import { emails, calendarEvents, users, userSettings, chatMessages, emailFolders, emailFolderAssignments, folderRules, dailyDigests, notificationSettings, type Email, type InsertEmail, type CalendarEvent, type InsertCalendarEvent, type User, type UpsertUser, type EmailFolder, type InsertEmailFolder, type EmailFolderAssignment, type InsertEmailFolderAssignment, type FolderRule, type InsertFolderRule, type DailyDigest, type InsertDailyDigest, type NotificationSettings, type InsertNotificationSettings } from "@shared/schema";
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
  
  // Folder operations
  getUserFolders(userId: string): Promise<EmailFolder[]>;
  createFolder(userId: string, name: string, color?: string, description?: string): Promise<EmailFolder>;
  deleteFolder(folderId: number): Promise<void>;
  assignEmailToFolder(emailId: number, folderId: number): Promise<void>;
  getEmailsByFolder(folderId: number): Promise<any[]>;
  createFolderRule(userId: string, folderId: number, ruleType: string, ruleValue: string): Promise<FolderRule>;
  getFolderRules(userId: string): Promise<FolderRule[]>;
  applyFolderRules(emailId: number, userId: string): Promise<void>;
  
  // Daily digest operations
  saveDailyDigest(digest: any): Promise<DailyDigest>;
  getUserDailyDigests(userId: string, days: number): Promise<DailyDigest[]>;
  
  // Notification settings
  getUserNotificationSettings(userId: string): Promise<NotificationSettings | null>;
  updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings>;
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

  // Folder operations
  async getUserFolders(userId: string): Promise<EmailFolder[]> {
    try {
      return await db.select().from(emailFolders).where(eq(emailFolders.userId, userId));
    } catch (error) {
      console.error("Error fetching user folders:", error);
      throw error;
    }
  }

  async createFolder(userId: string, name: string, color?: string, description?: string): Promise<EmailFolder> {
    try {
      const [folder] = await db
        .insert(emailFolders)
        .values({
          userId,
          name,
          color: color || "#3b82f6",
          description,
        })
        .returning();
      return folder;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async deleteFolder(folderId: number): Promise<void> {
    try {
      // First remove all email assignments to this folder
      await db.delete(emailFolderAssignments).where(eq(emailFolderAssignments.folderId, folderId));
      // Then remove all rules for this folder
      await db.delete(folderRules).where(eq(folderRules.folderId, folderId));
      // Finally delete the folder itself
      await db.delete(emailFolders).where(eq(emailFolders.id, folderId));
    } catch (error) {
      console.error("Error deleting folder:", error);
      throw error;
    }
  }

  async assignEmailToFolder(emailId: number, folderId: number): Promise<void> {
    try {
      await db
        .insert(emailFolderAssignments)
        .values({ emailId, folderId })
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error assigning email to folder:", error);
      throw error;
    }
  }

  async getEmailsByFolder(folderId: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          email: emails,
          assignment: emailFolderAssignments,
        })
        .from(emails)
        .innerJoin(emailFolderAssignments, eq(emails.id, emailFolderAssignments.emailId))
        .where(eq(emailFolderAssignments.folderId, folderId));
      
      return result.map(r => r.email);
    } catch (error) {
      console.error("Error fetching emails by folder:", error);
      throw error;
    }
  }

  async createFolderRule(userId: string, folderId: number, ruleType: string, ruleValue: string): Promise<FolderRule> {
    try {
      const [rule] = await db
        .insert(folderRules)
        .values({
          userId,
          folderId,
          ruleType,
          ruleValue,
          priority: 0,
        })
        .returning();
      return rule;
    } catch (error) {
      console.error("Error creating folder rule:", error);
      throw error;
    }
  }

  async getFolderRules(userId: string): Promise<FolderRule[]> {
    try {
      return await db.select().from(folderRules).where(eq(folderRules.userId, userId));
    } catch (error) {
      console.error("Error fetching folder rules:", error);
      throw error;
    }
  }

  async applyFolderRules(emailId: number, userId: string): Promise<void> {
    try {
      // Get email details
      const [email] = await db.select().from(emails).where(eq(emails.id, emailId));
      if (!email) return;

      // Get active rules for this user
      const rules = await db
        .select()
        .from(folderRules)
        .where(eq(folderRules.userId, userId))
        .orderBy(folderRules.priority);

      for (const rule of rules) {
        let matches = false;
        
        switch (rule.ruleType) {
          case 'sender':
            matches = email.senderEmail === rule.ruleValue;
            break;
          case 'domain':
            matches = email.senderEmail.endsWith(rule.ruleValue);
            break;
          case 'subject':
            matches = email.subject.toLowerCase().includes(rule.ruleValue.toLowerCase());
            break;
          case 'keyword':
            matches = email.body?.toLowerCase().includes(rule.ruleValue.toLowerCase()) || false;
            break;
        }

        if (matches) {
          await this.assignEmailToFolder(emailId, rule.folderId);
          break; // Only apply first matching rule
        }
      }
    } catch (error) {
      console.error("Error applying folder rules:", error);
      throw error;
    }
  }

  // Daily digest operations
  async saveDailyDigest(digestData: any): Promise<DailyDigest> {
    try {
      const [digest] = await db
        .insert(dailyDigests)
        .values(digestData)
        .returning();
      return digest;
    } catch (error) {
      console.error("Error saving daily digest:", error);
      throw error;
    }
  }

  async getUserDailyDigests(userId: string, days: number = 7): Promise<DailyDigest[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return await db
        .select()
        .from(dailyDigests)
        .where(eq(dailyDigests.userId, userId))
        .orderBy(dailyDigests.date);
    } catch (error) {
      console.error("Error fetching daily digests:", error);
      throw error;
    }
  }

  // Notification settings
  async getUserNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const [settings] = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));
      return settings || null;
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      throw error;
    }
  }

  async updateNotificationSettings(userId: string, settingsData: Partial<InsertNotificationSettings>): Promise<NotificationSettings> {
    try {
      const [updated] = await db
        .insert(notificationSettings)
        .values({ userId, ...settingsData })
        .onConflictDoUpdate({
          target: notificationSettings.userId,
          set: { ...settingsData, updatedAt: new Date() }
        })
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
