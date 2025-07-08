import { pgTable, text, serial, integer, timestamp, varchar, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  sender: text("sender").notNull(),
  senderEmail: text("sender_email").notNull(),
  date: timestamp("date").notNull(),
  body: text("body"),
  category: text("category").notNull(), // 'FYI', 'Draft', 'Forward'
  messageId: text("message_id").notNull().unique(),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
});

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export const emailStats = z.object({
  totalEmails: z.number(),
  fyiCount: z.number(),
  draftCount: z.number(),
  forwardCount: z.number(),
  lastUpdated: z.string(),
});

export type EmailStats = z.infer<typeof emailStats>;

export const categorizedEmails = z.object({
  fyi: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    sender: z.string(),
    senderEmail: z.string(),
    date: z.string(),
    category: z.string(),
  })),
  draft: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    sender: z.string(),
    senderEmail: z.string(),
    date: z.string(),
    category: z.string(),
  })),
  forward: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    sender: z.string(),
    senderEmail: z.string(),
    date: z.string(),
    category: z.string(),
  })),
});

export type CategorizedEmails = z.infer<typeof categorizedEmails>;

// Session storage table for Google OAuth authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Google OAuth users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleAccessToken: text("google_access_token"), // For Gmail API access
  googleRefreshToken: text("google_refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Calendar events table
export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  summary: text("summary").notNull(),
  description: text("description"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time").notNull(),
  location: text("location"),
  attendees: text("attendees").array(),
  calendarId: text("calendar_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  createdAt: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// User settings for email categorization rules
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  emailRules: jsonb("email_rules").$type<{
    senderRules: { email: string; category: string; confidence: number }[];
    subjectRules: { pattern: string; category: string; confidence: number }[];
    generalPreferences: {
      prioritizePersonal: boolean;
      autoForwardCustomerService: boolean;
      treatNewslettersAsFYI: boolean;
    };
  }>().default({
    senderRules: [],
    subjectRules: [],
    generalPreferences: {
      prioritizePersonal: false,
      autoForwardCustomerService: true,
      treatNewslettersAsFYI: true,
    },
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// Chat messages for AI interaction
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  emailContext: jsonb("email_context").$type<{
    emailIds: number[];
    category?: string;
    action?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Email folders/labels
export const emailFolders = pgTable("email_folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  color: varchar("color").default("#3b82f6"), // hex color
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type EmailFolder = typeof emailFolders.$inferSelect;
export type InsertEmailFolder = typeof emailFolders.$inferInsert;

// Email folder assignments
export const emailFolderAssignments = pgTable("email_folder_assignments", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull().references(() => emails.id),
  folderId: integer("folder_id").notNull().references(() => emailFolders.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export type EmailFolderAssignment = typeof emailFolderAssignments.$inferSelect;
export type InsertEmailFolderAssignment = typeof emailFolderAssignments.$inferInsert;

// Folder rules for automatic assignment
export const folderRules = pgTable("folder_rules", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").notNull().references(() => emailFolders.id),
  ruleType: varchar("rule_type").notNull(), // "sender", "subject", "domain", "keyword"
  ruleValue: varchar("rule_value").notNull(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // higher numbers = higher priority
  createdAt: timestamp("created_at").defaultNow(),
});

export type FolderRule = typeof folderRules.$inferSelect;
export type InsertFolderRule = typeof folderRules.$inferInsert;

// Daily digest system
export const dailyDigests = pgTable("daily_digests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(), // Date this digest covers
  totalEmails: integer("total_emails").default(0),
  salesCount: integer("sales_count").default(0),
  salesTotal: text("sales_total"), // Store as string to handle currency
  productBreakdown: jsonb("product_breakdown").default('{}'), // {"smoked oak": 5, "walnut": 3}
  keyMetrics: jsonb("key_metrics").default('{}'), // Store extracted business metrics
  summary: text("summary"), // Generated AI summary
  createdAt: timestamp("created_at").defaultNow(),
});

export type DailyDigest = typeof dailyDigests.$inferSelect;
export type InsertDailyDigest = typeof dailyDigests.$inferInsert;

// Notification preferences
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  digestEnabled: boolean("digest_enabled").default(true),
  digestTime: varchar("digest_time").default("09:00"), // Time in HH:MM format
  timezone: varchar("timezone").default("UTC"),
  includeSalesMetrics: boolean("include_sales_metrics").default(true),
  includeEmailCounts: boolean("include_email_counts").default(true),
  includeTopSenders: boolean("include_top_senders").default(true),
  customKeywords: text("custom_keywords").array().default([]), // Keywords to track
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;
