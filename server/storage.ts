import { emails, calendarEvents, users, userSettings, chatMessages, emailFolders, emailFolderAssignments, folderRules, dailyDigests, fyiDigests, notificationSettings, tasks, taskComments, emailCorrelations, teamMembers, projects, projectStages, userPreferences, userProfiles, auditLogs, creditLogs, decisions, operationalMemory, type Email, type InsertEmail, type CalendarEvent, type InsertCalendarEvent, type User, type UpsertUser, type EmailFolder, type InsertEmailFolder, type EmailFolderAssignment, type InsertEmailFolderAssignment, type FolderRule, type InsertFolderRule, type DailyDigest, type InsertDailyDigest, type FyiDigest, type InsertFyiDigest, type NotificationSettings, type InsertNotificationSettings, type Task, type InsertTask, type TaskComment, type InsertTaskComment, type EmailCorrelation, type InsertEmailCorrelation, type TeamMember, type InsertTeamMember, type Project, type InsertProject, type ProjectStage, type InsertProjectStage, type UserPreferences, type InsertUserPreferences, type UserProfile, type InsertUserProfile, type AuditLog, type InsertAuditLog, type Decision, type InsertDecision, type OperationalMemory, type InsertOperationalMemory } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // ... (previous methods)
  // Email operations
  getEmails(userId: string): Promise<Email[]>;
  getEmailsByCategory(userId: string, category: string): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  upsertEmail(email: InsertEmail): Promise<Email>;
  markEmailAsRead(id: number, isRead: boolean): Promise<any>;
  clearEmails(userId: string): Promise<void>;
  getEmailStats(userId: string): Promise<{
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
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Settings operations
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<any>;

  // Chat operations
  getChatMessages(userId: string): Promise<any[]>;
  createChatMessage(message: any): Promise<any>;
  clearChatMessages(userId: string): Promise<void>;

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

  // Task management
  getUserTasks(userId: string, statuses?: string[]): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Task comments
  getTaskComments(taskId: number): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;

  // Email correlations
  createEmailCorrelations(correlations: InsertEmailCorrelation[]): Promise<void>;
  getEmailCorrelationGroup(emailId: number): Promise<EmailCorrelation | undefined>;
  getCorrelationsByGroup(groupId: string): Promise<EmailCorrelation[]>;
  getUserCorrelationGroups(userId: string): Promise<Array<{
    groupId: string;
    subject: string;
    correlationType: string;
    emailCount: number;
  }>>;

  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile>;

  // Phase 8: Privacy & Audit
  createAuditLog(userId: string, action: string, details?: string, emailId?: number, taskId?: number, decisionId?: number): Promise<AuditLog>;
  getAuditLogs(userId: string): Promise<AuditLog[]>;
  deleteAllUserData(userId: string): Promise<void>;
  resetUserProfile(userId: string): Promise<void>;

  // FYI Digest operations
  getFyiDigests(userId: string, status?: string): Promise<FyiDigest[]>;
  createFyiDigest(digest: InsertFyiDigest): Promise<FyiDigest>;
  updateFyiDigest(id: number, updates: Partial<InsertFyiDigest>): Promise<FyiDigest>;
  markEmailsAsSeenInDonna(emailIds: number[]): Promise<void>;

  // Agent support
  getUnprocessedEmails(userId: string): Promise<Email[]>;
  updateUserLastAgentRun(userId: string): Promise<void>;
  deductCredits(userId: string, amount: number, action: string, details?: string): Promise<boolean>;

  // Decision operations
  createDecision(decision: InsertDecision): Promise<Decision>;
  getDecisions(userId: string, status?: string): Promise<Decision[]>;
  getDecisionById(id: number): Promise<Decision | undefined>;
  updateDecision(id: number, updates: Partial<Decision>): Promise<Decision>;

  // Operational Memory operations
  getOperationalMemory(userId: string, key: string): Promise<OperationalMemory | undefined>;
  upsertOperationalMemory(userId: string, key: string, value: any): Promise<OperationalMemory>;

  // Preferences & Team
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  getTeamMembers(userId: string): Promise<TeamMember[]>;
}

export class MemStorage implements IStorage {
  private emails: Map<number, Email>;
  private users: Map<string, User>;
  private decisions: Map<number, Decision>;
  private currentId: number;
  private lastUpdated: Date;

  constructor() {
    this.emails = new Map();
    this.users = new Map();
    this.decisions = new Map();
    this.currentId = 1;
    this.lastUpdated = new Date();
  }

  async getEmails(userId: string): Promise<Email[]> {
    return Array.from(this.emails.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getEmailsByCategory(userId: string, category: string): Promise<Email[]> {
    return Array.from(this.emails.values())
      .filter(email => email.userId === userId && email.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.currentId++;
    const email: Email = {
      ...insertEmail,
      id,
      body: insertEmail.body ?? null,
      folder: insertEmail.folder ?? null,
      provider: insertEmail.provider ?? null,
      bodyPlainClean: insertEmail.bodyPlainClean ?? null,
      threadId: insertEmail.threadId ?? null,
      isProcessed: insertEmail.isProcessed ?? false,
      isRead: insertEmail.isRead ?? false,
      aiSummary: insertEmail.aiSummary ?? null,
      emailHash: insertEmail.emailHash ?? null,
      isSeenInDonna: insertEmail.isSeenInDonna ?? false,
      triageMetadata: insertEmail.triageMetadata as any,
    };
    this.emails.set(id, email);
    this.lastUpdated = new Date();
    return email;
  }

  async upsertEmail(insertEmail: InsertEmail): Promise<Email> {
    const existing = Array.from(this.emails.values()).find(e => e.messageId === insertEmail.messageId);
    if (existing) {
      const updated: Email = {
        ...existing,
        ...insertEmail,
        id: existing.id,
        body: insertEmail.body ?? existing.body,
        folder: insertEmail.folder ?? existing.folder,
        provider: insertEmail.provider ?? existing.provider,
        bodyPlainClean: insertEmail.bodyPlainClean ?? existing.bodyPlainClean,
        threadId: insertEmail.threadId ?? existing.threadId,
        isProcessed: insertEmail.isProcessed ?? existing.isProcessed,
        isRead: insertEmail.isRead ?? existing.isRead,
        aiSummary: insertEmail.aiSummary ?? existing.aiSummary,
        emailHash: insertEmail.emailHash ?? existing.emailHash,
        triageMetadata: (insertEmail.triageMetadata as any) ?? existing.triageMetadata,
      };
      this.emails.set(existing.id, updated);
      return updated;
    }
    return this.createEmail(insertEmail);
  }

  async clearEmails(userId: string): Promise<void> {
    const entries = Array.from(this.emails.entries());
    for (const [id, email] of entries) {
      if (email.userId === userId) {
        this.emails.delete(id);
      }
    }
    this.lastUpdated = new Date();
  }

  async getEmailStats(userId: string) {
    const allEmails = Array.from(this.emails.values()).filter(e => e.userId === userId);
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

  async markEmailAsRead(id: number, isRead: boolean): Promise<any> {
    const email = this.emails.get(id);
    if (email) {
      email.isRead = isRead;
      this.emails.set(id, email);
    }
  }

  async getCalendarEvents(userId: string): Promise<CalendarEvent[]> { return []; }
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> { throw new Error("Not implemented"); }
  async clearCalendarEvents(userId: string): Promise<void> { }

  async getUserSettings(userId: string): Promise<any> { return {}; }
  async updateUserSettings(userId: string, settings: any): Promise<any> { return {}; }

  async getChatMessages(userId: string): Promise<any[]> { return []; }
  async createChatMessage(message: any): Promise<any> { return {}; }
  async clearChatMessages(userId: string): Promise<void> { }

  async getEmailById(id: number): Promise<any> { return this.emails.get(id); }
  async updateEmailCategory(id: number, category: string): Promise<any> {
    const email = this.emails.get(id);
    if (email) {
      email.category = category;
      this.emails.set(id, email);
    }
  }

  async getUserFolders(userId: string): Promise<EmailFolder[]> { return []; }
  async createFolder(userId: string, name: string): Promise<EmailFolder> { throw new Error("Not implemented"); }
  async deleteFolder(folderId: number): Promise<void> { }
  async assignEmailToFolder(emailId: number, folderId: number): Promise<void> { }
  async getEmailsByFolder(folderId: number): Promise<any[]> { return []; }
  async createFolderRule(userId: string, folderId: number, ruleType: string, ruleValue: string): Promise<FolderRule> { throw new Error("Not implemented"); }
  async getFolderRules(userId: string): Promise<FolderRule[]> { return []; }
  async applyFolderRules(emailId: number, userId: string): Promise<void> { }

  async saveDailyDigest(digest: any): Promise<DailyDigest> { throw new Error("Not implemented"); }
  async getUserDailyDigests(userId: string, days: number): Promise<DailyDigest[]> { return []; }

  async getUserNotificationSettings(userId: string): Promise<NotificationSettings | null> { return null; }
  async updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings> { throw new Error("Not implemented"); }

  async getUserTasks(userId: string, statuses?: string[]): Promise<Task[]> { return []; }
  async getTaskById(id: number): Promise<Task | undefined> { return undefined; }
  async createTask(task: InsertTask): Promise<Task> { throw new Error("Not implemented"); }
  async updateTask(id: number, updates: Partial<Task>): Promise<Task> { throw new Error("Not implemented"); }
  async deleteTask(id: number): Promise<void> { }

  async getTaskComments(taskId: number): Promise<TaskComment[]> { return []; }
  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> { throw new Error("Not implemented"); }

  async createEmailCorrelations(correlations: InsertEmailCorrelation[]): Promise<void> { }
  async getEmailCorrelationGroup(emailId: number): Promise<EmailCorrelation | undefined> { return undefined; }
  async getCorrelationsByGroup(groupId: string): Promise<EmailCorrelation[]> { return []; }
  async getUserCorrelationGroups(userId: string): Promise<any[]> { return []; }

  async getUserProfile(userId: string): Promise<UserProfile | null> { return null; }
  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile> { throw new Error("Not implemented"); }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const existing = this.users.get(userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email ?? (existing?.email || null),
      firstName: userData.firstName ?? (existing?.firstName || null),
      lastName: userData.lastName ?? (existing?.lastName || null),
      profileImageUrl: userData.profileImageUrl ?? (existing?.profileImageUrl || null),
      emailProvider: userData.emailProvider ?? (existing?.emailProvider || null),
      googleAccessToken: userData.googleAccessToken ?? (existing?.googleAccessToken || null),
      googleRefreshToken: userData.googleRefreshToken ?? (existing?.googleRefreshToken || null),
      microsoftAccessToken: userData.microsoftAccessToken ?? (existing?.microsoftAccessToken || null),
      microsoftRefreshToken: userData.microsoftRefreshToken ?? (existing?.microsoftRefreshToken || null),
      lastAgentRun: userData.lastAgentRun ?? (existing?.lastAgentRun || null),
      credits: (userData.credits !== undefined) ? userData.credits : (existing?.credits ?? 100),
      totalCreditsEarned: (userData.totalCreditsEarned !== undefined) ? userData.totalCreditsEarned : (existing?.totalCreditsEarned ?? 100),
      planType: (userData.planType !== undefined) ? userData.planType : (existing?.planType ?? "free"),
      trialEndsAt: (userData.trialEndsAt !== undefined) ? userData.trialEndsAt : (existing?.trialEndsAt ?? null),
      subscriptionId: (userData.subscriptionId !== undefined) ? userData.subscriptionId : (existing?.subscriptionId ?? null),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async createAuditLog(userId: string, action: string, details?: string, emailId?: number, taskId?: number, decisionId?: number): Promise<AuditLog> { throw new Error("Not implemented"); }
  async getAuditLogs(userId: string): Promise<AuditLog[]> { return []; }
  async deleteAllUserData(userId: string): Promise<void> { }
  async resetUserProfile(userId: string): Promise<void> { }

  async getUnprocessedEmails(userId: string): Promise<Email[]> {
    return Array.from(this.emails.values()).filter(e => e.userId === userId && !e.isProcessed);
  }

  async updateUserLastAgentRun(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastAgentRun = new Date();
      this.users.set(userId, user);
    }
  }

  async deductCredits(userId: string, amount: number, action: string, details?: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    if ((user.credits ?? 0) < amount) return false;

    user.credits = (user.credits ?? 0) - amount;
    this.users.set(userId, user);
    return true;
  }

  async getFyiDigests(userId: string, status?: string): Promise<any[]> { return []; }
  async createFyiDigest(digest: any): Promise<any> { throw new Error("Not implemented"); }
  async updateFyiDigest(id: number, updates: any): Promise<any> { throw new Error("Not implemented"); }
  async markEmailsAsSeenInDonna(emailIds: number[]): Promise<void> { }

  async createDecision(decisionData: InsertDecision): Promise<Decision> {
    const id = this.currentId++;
    const decision: Decision = {
      id,
      userId: decisionData.userId,
      type: decisionData.type,
      status: (decisionData.status ?? 'pending') as any,
      summary: decisionData.summary,
      recommendedOption: decisionData.recommendedOption ?? null,
      riskNotes: decisionData.riskNotes ?? null,
      metadata: (decisionData.metadata ?? {}) as any,
      decisionTaken: decisionData.decisionTaken ?? null,
      aiReasoning: decisionData.aiReasoning ?? null,
      confidence: decisionData.confidence ?? null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.decisions.set(id, decision);
    return decision;
  }

  async getDecisions(userId: string, status?: string): Promise<Decision[]> {
    const all = Array.from(this.decisions.values()) as Decision[];
    const userDecisions = all.filter(d => d.userId === userId);
    if (status) {
      return userDecisions.filter(d => d.status === status).sort((a, b) => {
        const bTime = (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        const aTime = (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        return bTime - aTime;
      });
    }
    return userDecisions.sort((a, b) => {
      const bTime = (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
      const aTime = (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
      return bTime - aTime;
    });
  }

  async getDecisionById(id: number): Promise<Decision | undefined> {
    return this.decisions.get(id);
  }

  async updateDecision(id: number, updates: Partial<Decision>): Promise<Decision> {
    const existing = this.decisions.get(id);
    if (!existing) throw new Error(`Decision ${id} not found`);
    const updated = { ...existing, ...updates };
    this.decisions.set(id, updated);
    return updated;
  }

  async getOperationalMemory(userId: string, key: string): Promise<OperationalMemory | undefined> { return undefined; }
  async upsertOperationalMemory(userId: string, key: string, value: any): Promise<OperationalMemory> { throw new Error("Not implemented"); }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> { return null; }
  async getTeamMembers(userId: string): Promise<TeamMember[]> { return []; }

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
  async getEmails(userId: string): Promise<Email[]> {
    console.log(`Storage: Fetching emails for user ${userId}...`);
    const results = await db.select().from(emails).where(eq(emails.userId, userId)).orderBy(desc(emails.date));
    console.log(`Storage: Found ${results.length} emails for user ${userId}`);
    return results;
  }

  async getEmailsByCategory(userId: string, category: string): Promise<Email[]> {
    return await db.select().from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.category, category)))
      .orderBy(desc(emails.date));
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db.insert(emails).values(insertEmail as any).returning();
    return email as Email;
  }

  async upsertEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db
      .insert(emails)
      .values(insertEmail as any)
      .onConflictDoUpdate({
        target: emails.messageId,
        set: {
          category: insertEmail.category,
          body: insertEmail.body, // Update body if it was previously empty/missing
          isProcessed: insertEmail.isProcessed ?? false,
          isRead: insertEmail.isRead ?? false,
          isSeenInDonna: insertEmail.isSeenInDonna ?? false,
          aiSummary: insertEmail.aiSummary ?? null,
          triageMetadata: (insertEmail.triageMetadata as any) ?? null,
        },
      })
      .returning();
    return email;
  }

  async clearEmails(userId: string): Promise<void> {
    // Clear correlations first for user's emails
    const userEmails = await this.getEmails(userId);
    const emailIds = userEmails.map(e => e.id);

    if (emailIds.length > 0) {
      // 1. Clear correlations
      await db.delete(emailCorrelations).where(inArray(emailCorrelations.emailId, emailIds));

      // 2. Clear folder assignments
      await db.delete(emailFolderAssignments).where(inArray(emailFolderAssignments.emailId, emailIds));

      // 3. Clear task comments linked to emails
      await db.delete(taskComments).where(inArray(taskComments.emailId, emailIds));

      // 4. Unlink tasks from emails (set detectedFromEmailId to null)
      await db.update(tasks)
        .set({ detectedFromEmailId: null })
        .where(inArray(tasks.detectedFromEmailId, emailIds));

      // 5. Finally delete emails
      await db.delete(emails).where(eq(emails.userId, userId));
    }
  }

  async getEmailStats(userId: string) {
    const allEmails = await this.getEmails(userId);
    const fyiCount = allEmails.filter(email => email.category === 'FYI').length;
    const draftCount = allEmails.filter(email => email.category === 'Draft').length;
    const forwardCount = allEmails.filter(email => email.category === 'Forward').length;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    const result = {
      totalEmails: allEmails.length,
      fyiCount,
      draftCount,
      forwardCount,
      lastUpdated: user?.lastAgentRun ? user.lastAgentRun.toISOString() : new Date().toISOString(),
    };
    console.log(`Storage: Stats for ${userId}:`, JSON.stringify(result));
    return result;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
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

  async clearChatMessages(userId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  }

  // Email details and management
  async getEmailById(id: number): Promise<any> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email;
  }

  async updateEmailCategory(id: number, category: string): Promise<any> {
    const [updatedEmail] = await db
      .update(emails)
      .set({ category })
      .where(eq(emails.id, id))
      .returning();
    return updatedEmail;
  }

  async markEmailAsRead(id: number, isRead: boolean): Promise<any> {
    const [updatedEmail] = await db
      .update(emails)
      .set({ isRead })
      .where(eq(emails.id, id))
      .returning();
    return updatedEmail;
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

  // Task management methods
  async getUserTasks(userId: string, statuses?: string[]): Promise<Task[]> {
    if (statuses && statuses.length > 0) {
      return await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            inArray(tasks.status, statuses as any[])
          )
        )
        .orderBy(desc(tasks.createdAt));
    }

    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    const result = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(taskComments.createdAt);
    return result;
  }

  async createTaskComment(commentData: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await db.insert(taskComments).values(commentData).returning();
    return comment;
  }

  // Email correlation methods
  async createEmailCorrelations(correlations: InsertEmailCorrelation[]): Promise<void> {
    try {
      if (correlations.length > 0) {
        await db.insert(emailCorrelations).values(correlations);
      }
    } catch (error) {
      console.error("Error creating email correlations:", error);
      throw error;
    }
  }

  async getEmailCorrelationGroup(emailId: number): Promise<EmailCorrelation | undefined> {
    try {
      const [correlation] = await db
        .select()
        .from(emailCorrelations)
        .where(eq(emailCorrelations.emailId, emailId));
      return correlation;
    } catch (error) {
      console.error("Error getting email correlation group:", error);
      throw error;
    }
  }

  async getCorrelationsByGroup(groupId: string): Promise<EmailCorrelation[]> {
    try {
      return await db
        .select()
        .from(emailCorrelations)
        .where(eq(emailCorrelations.groupId, groupId))
        .orderBy(desc(emailCorrelations.createdAt));
    } catch (error) {
      console.error("Error getting correlations by group:", error);
      throw error;
    }
  }

  async getUserCorrelationGroups(userId: string): Promise<Array<{
    groupId: string;
    subject: string;
    correlationType: string;
    emailCount: number;
  }>> {
    try {
      // Get all emails for this user
      const userEmails = await db
        .select({ id: emails.id })
        .from(emails)
        .innerJoin(users, eq(emails.senderEmail, users.email))
        .where(eq(users.id, userId));

      const emailIds = userEmails.map(e => e.id);

      if (emailIds.length === 0) return [];

      // Get correlation groups for user's emails
      const groups = await db
        .select({
          groupId: emailCorrelations.groupId,
          subject: emailCorrelations.subject,
          correlationType: emailCorrelations.correlationType,
          emailCount: sql<number>`count(*)::int`
        })
        .from(emailCorrelations)
        .where(sql`${emailCorrelations.emailId} = ANY(${emailIds})`)
        .groupBy(
          emailCorrelations.groupId,
          emailCorrelations.subject,
          emailCorrelations.correlationType
        );

      return groups;
    } catch (error) {
      console.error("Error getting user correlation groups:", error);
      throw error;
    }
  }

  // ============================================
  // TEAM MEMBER METHODS
  // ============================================

  async getTeamMembers(userId: string): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId))
      .orderBy(teamMembers.name);
  }

  async getTeamMemberById(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(data: InsertTeamMember): Promise<TeamMember> {
    try {
      console.log("Storage: Creating team member with data:", JSON.stringify(data, null, 2));
      const [member] = await db.insert(teamMembers).values(data).returning();
      console.log("Storage: Team member created:", member);
      return member;
    } catch (error: any) {
      console.error("Storage: Error creating team member:", error.message);
      console.error("Storage: Full error:", error);
      throw error;
    }
  }

  async updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember> {
    const [member] = await db
      .update(teamMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();
    return member;
  }

  async deleteTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // ============================================
  // PROJECT METHODS
  // ============================================

  async getProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(projects.createdAt);
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // ============================================
  // PROJECT STAGE METHODS
  // ============================================

  async getProjectStages(projectId: number): Promise<ProjectStage[]> {
    return await db
      .select()
      .from(projectStages)
      .where(eq(projectStages.projectId, projectId))
      .orderBy(projectStages.position);
  }

  async createProjectStage(data: InsertProjectStage): Promise<ProjectStage> {
    const [stage] = await db.insert(projectStages).values(data).returning();
    return stage;
  }

  async updateProjectStage(id: number, updates: Partial<ProjectStage>): Promise<ProjectStage> {
    const [stage] = await db
      .update(projectStages)
      .set(updates)
      .where(eq(projectStages.id, id))
      .returning();
    return stage;
  }

  async deleteProjectStage(id: number): Promise<void> {
    await db.delete(projectStages).where(eq(projectStages.id, id));
  }

  // ============================================
  // APPROVAL WORKFLOW METHODS
  // ============================================

  async getPendingApprovalTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.approvalStatus, "pending_approval")))
      .orderBy(desc(tasks.createdAt));
  }

  async approveTask(id: number, approvedBy: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async rejectTask(id: number, rejectedBy: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        approvalStatus: "rejected",
        approvedBy: rejectedBy,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // ============================================
  // USER PREFERENCES METHODS
  // ============================================

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || null;
  }

  async updateUserPreferences(userId: string, updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);

    if (existing) {
      const [prefs] = await db
        .update(userPreferences)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return prefs;
    } else {
      const [prefs] = await db
        .insert(userPreferences)
        .values({ userId, ...updates })
        .returning();
      return prefs;
    }
  }

  // ============================================
  // USER PROFILE METHODS
  // ============================================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile || null;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);

    if (existing) {
      const [profile] = await db
        .update(userProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return profile;
    } else {
      const [profile] = await db
        .insert(userProfiles)
        .values({ userId, ...updates })
        .returning();
      return profile;
    }
  }

  // ============================================
  // PRIVACY & AUDIT METHODS (Phase 8)
  // ============================================

  async createAuditLog(userId: string, action: string, details?: string, emailId?: number, taskId?: number, decisionId?: number): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values({
        userId,
        action,
        details,
        emailId,
        taskId,
        decisionId
      })
      .returning();
    return log;
  }

  async getAuditLogs(userId: string): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp));
  }

  async deleteAllUserData(userId: string): Promise<void> {
    // Delete in order of dependencies
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    await db.delete(taskComments).where(eq(taskComments.userId, userId));
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(emailCorrelations).where(inArray(emailCorrelations.emailId,
      db.select({ id: emails.id }).from(emails).where(eq(emails.userId, userId))
    ));
    await db.delete(emailFolderAssignments).where(inArray(emailFolderAssignments.emailId,
      db.select({ id: emails.id }).from(emails).where(eq(emails.userId, userId))
    ));
    await db.delete(emails).where(eq(emails.userId, userId));
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
    await db.delete(dailyDigests).where(eq(dailyDigests.userId, userId));
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    await db.delete(notificationSettings).where(eq(notificationSettings.userId, userId));
    // We intentionally keep the user record itself for authentication, 
    // but we could clear its tokens if requested. For now, we clear data.
  }

  async resetUserProfile(userId: string): Promise<void> {
    await db
      .update(userProfiles)
      .set({
        greetings: [],
        signoffs: [],
        formalityScore: 0.5,
        verbosity: "medium",
        commonPhrases: [],
        doRules: [],
        dontRules: [],
        stylePrompt: null,
        analyzedEmailCount: 0,
        updatedAt: new Date()
      })
      .where(eq(userProfiles.userId, userId));
  }

  async getUnprocessedEmails(userId: string): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.isProcessed, false)))
      .orderBy(desc(emails.date));
  }

  async updateUserLastAgentRun(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastAgentRun: new Date() })
      .where(eq(users.id, userId));
  }

  async deductCredits(userId: string, amount: number, action: string, details?: string): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        if (!user || (user.credits ?? 0) < amount) {
          return false;
        }

        await tx
          .update(users)
          .set({ credits: (user.credits ?? 0) - amount })
          .where(eq(users.id, userId));

        await tx.insert(creditLogs).values({
          userId,
          amount: -amount,
          action,
          description: details
        });

        return true;
      });
    } catch (error) {
      console.error("Error deducting credits:", error);
      return false;
    }
  }

  async getFyiDigests(userId: string, status?: string): Promise<FyiDigest[]> {
    if (status) {
      return await db.select().from(fyiDigests).where(and(eq(fyiDigests.userId, userId), eq(fyiDigests.status, status as any))).orderBy(desc(fyiDigests.lastEmailAt));
    }
    return await db.select().from(fyiDigests).where(eq(fyiDigests.userId, userId)).orderBy(desc(fyiDigests.lastEmailAt));
  }

  async createFyiDigest(digestData: InsertFyiDigest): Promise<FyiDigest> {
    const [digest] = await db.insert(fyiDigests).values(digestData).returning();
    return digest;
  }

  async updateFyiDigest(id: number, updates: Partial<InsertFyiDigest>): Promise<FyiDigest> {
    const [digest] = await db.update(fyiDigests).set({ ...updates, updatedAt: new Date() }).where(eq(fyiDigests.id, id)).returning();
    return digest;
  }

  async markEmailsAsSeenInDonna(emailIds: number[]): Promise<void> {
    if (emailIds.length === 0) return;
    await db.update(emails).set({ isSeenInDonna: true }).where(inArray(emails.id, emailIds));
  }

  // Decision operations
  async createDecision(decisionData: InsertDecision): Promise<Decision> {
    const [decision] = await db.insert(decisions).values(decisionData).returning();
    return decision;
  }

  async getDecisions(userId: string, status?: string): Promise<Decision[]> {
    if (status) {
      return await db.select().from(decisions).where(and(eq(decisions.userId, userId), eq(decisions.status, status as any))).orderBy(desc(decisions.createdAt));
    }
    return await db.select().from(decisions).where(eq(decisions.userId, userId)).orderBy(desc(decisions.createdAt));
  }

  async getDecisionById(id: number): Promise<Decision | undefined> {
    const [decision] = await db.select().from(decisions).where(eq(decisions.id, id));
    return decision;
  }

  async updateDecision(id: number, updates: Partial<Decision>): Promise<Decision> {
    const [decision] = await db.update(decisions).set(updates).where(eq(decisions.id, id)).returning();
    if (!decision) throw new Error(`Decision ${id} not found`);
    return decision;
  }

  // Operational Memory operations
  async getOperationalMemory(userId: string, key: string): Promise<OperationalMemory | undefined> {
    const [memory] = await db.select().from(operationalMemory).where(and(eq(operationalMemory.userId, userId), eq(operationalMemory.key, key)));
    return memory;
  }

  async upsertOperationalMemory(userId: string, key: string, value: any): Promise<OperationalMemory> {
    const existing = await this.getOperationalMemory(userId, key);
    if (existing) {
      const [memory] = await db.update(operationalMemory).set({ value, updatedAt: new Date() }).where(eq(operationalMemory.id, existing.id)).returning();
      return memory;
    } else {
      const [memory] = await db.insert(operationalMemory).values({ userId, key, value }).returning();
      return memory;
    }
  }
}

export const storage = new DatabaseStorage();
