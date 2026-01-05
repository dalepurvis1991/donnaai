import { pgTable, text, serial, integer, timestamp, varchar, jsonb, index, boolean, real } from "drizzle-orm/pg-core";
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
  userId: varchar("user_id").notNull().references(() => users.id),
  threadId: text("thread_id"),
  isProcessed: boolean("is_processed").default(false),
  isRead: boolean("is_read").default(false),
  aiSummary: text("ai_summary"),
  // MVP Phase 1: Enhanced email fields
  folder: varchar("folder"), // 'inbox', 'sent', 'drafts', 'archive'
  provider: varchar("provider"), // 'google', 'microsoft'
  bodyPlainClean: text("body_plain_clean"), // Cleaned email body (no signatures/quotes)
  emailHash: varchar("email_hash"), // Hash for deduplication
  isSeenInDonna: boolean("is_seen_in_donna").default(false), // MVP: "Mark Seen" without provider write access
  // Orchestrator Phase 1: Triage Metadata
  triageMetadata: jsonb("triage_metadata").$type<{
    intent?: string;
    entities?: {
      customer?: string;
      orderRef?: string;
      sku?: string;
      amount?: number;
      deadline?: string;
      riskFlags?: string[];
    };
    confidence: number;
    classification: {
      category: string;
      urgency: 'now' | 'today' | 'this_week' | 'later';
      impact: 'high' | 'medium' | 'low';
    };
  }>(),
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
    isRead: z.boolean().optional(),
  })),
  draft: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    sender: z.string(),
    senderEmail: z.string(),
    date: z.string(),
    category: z.string(),
    isRead: z.boolean().optional(),
  })),
  forward: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    sender: z.string(),
    senderEmail: z.string(),
    date: z.string(),
    category: z.string(),
    isRead: z.boolean().optional(),
  })),
  totalTraces: z.number().optional(),
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

// User storage table for OAuth users (Google & Microsoft)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),

  // Email provider tracking
  emailProvider: varchar("email_provider"), // 'google' | 'microsoft'

  // Google OAuth tokens
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),

  // Microsoft OAuth tokens
  microsoftAccessToken: text("microsoft_access_token"),
  microsoftRefreshToken: text("microsoft_refresh_token"),

  lastAgentRun: timestamp("last_agent_run"),

  // Credits & Usage tracking
  credits: integer("credits").default(100),
  totalCreditsEarned: integer("total_credits_earned").default(100),

  // Commercial / Plan Tiering
  planType: varchar("plan_type", { enum: ["free", "trial", "monthly", "yearly"] }).default("free"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionId: varchar("subscription_id"),

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

// Orchestrator Decisions (Approval Queue)
export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["spend", "publish", "pricing", "external_comms", "data_change", "task_approval", "other"] }).notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  summary: text("summary").notNull(),
  recommendedOption: text("recommended_option"),
  riskNotes: text("risk_notes"),
  metadata: jsonb("metadata").$type<{
    emailId?: number;
    taskId?: number;
    draft?: any;
    triage?: any;
    confidenceUsed?: number;
    thresholdUsed?: number;
  }>().default({}),
  decisionTaken: text("decision_taken"), // Store reasoning/feedback here
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = typeof decisions.$inferInsert;

// Operational Memory (High-level business state)
export const operationalMemory = pgTable("operational_memory", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  key: varchar("key").notNull(), // e.g., 'priorities', 'risks', 'active_projects'
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OperationalMemory = typeof operationalMemory.$inferSelect;
export type InsertOperationalMemory = typeof operationalMemory.$inferInsert;

// FYI Grouped Digests
export const fyiDigests = pgTable("fyi_digests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  groupKey: varchar("group_key").notNull(), // sender/domain or subject pattern
  title: varchar("title").notNull(),
  summary: text("summary"), // AI summary (bullets)
  count: integer("count").default(1),
  metrics: jsonb("metrics").default('{}'), // totals, £ amounts
  emailIds: jsonb("email_ids").$type<number[]>().default([]),
  status: varchar("status", { enum: ["active", "seen", "dismissed"] }).default("active"),
  lastEmailAt: timestamp("last_email_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type FyiDigest = typeof fyiDigests.$inferSelect;
export type InsertFyiDigest = typeof fyiDigests.$inferInsert;

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

// Tasks/Jobs tracking system - Enhanced with Projects & Assignment
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["proposed", "pending", "assigned", "in_progress", "completed", "cancelled", "verified"] }).default("proposed"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  category: varchar("category"), // e.g., "procurement", "maintenance", "admin"
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),

  // AI-detected metadata
  detectedFromEmailId: integer("detected_from_email_id").references(() => emails.id),
  relatedEmails: jsonb("related_emails").$type<number[]>().default([]), // Array of email IDs
  autoDetected: boolean("auto_detected").default(false),
  confidence: real("confidence"), // AI confidence in task detection

  // Business context
  supplier: varchar("supplier"),
  amount: real("amount"),
  currency: varchar("currency").default("GBP"),
  orderNumber: varchar("order_number"),
  invoiceNumber: varchar("invoice_number"),

  // Task tracking stages
  stages: jsonb("stages").$type<{
    stage: string;
    completed: boolean;
    completedAt?: Date;
    emailId?: number;
  }[]>().default([]),

  // === NEW: Project & Kanban Integration ===
  projectId: integer("project_id"), // Link to project (board)
  stageId: integer("stage_id"), // Current kanban column

  // === NEW: Team Assignment ===
  assigneeId: integer("assignee_id"), // Team member assigned to this task
  wasAutoAssigned: boolean("was_auto_assigned").default(false),
  assignmentReasoning: text("assignment_reasoning"), // AI explanation for why this person was chosen

  // === NEW: Time Estimation ===
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours"),

  // === NEW: Job Brief (AI-generated context from emails) ===
  jobBrief: text("job_brief"), // Detailed brief with context, objectives, deliverables

  // MVP Phase 1: Enhanced task extraction fields
  evidenceQuote: text("evidence_quote"), // Exact quote from email that triggered task
  entities: jsonb("entities").$type<{
    people?: string[];
    orgs?: string[];
    orderRefs?: string[];
    amounts?: number[];
    dates?: string[];
  }>().default({}),
  sourceLink: varchar("source_link"), // Deep link to originating email
  taskOwner: varchar("task_owner", { enum: ["me", "contact", "unknown"] }),

  // === NEW: Approval Workflow ===
  approvalStatus: varchar("approval_status", {
    enum: ["pending_approval", "approved", "rejected"]
  }).default("pending_approval"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"), // User ID who approved

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Task comments/notes
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isSystemGenerated: boolean("is_system_generated").default(false),
  emailId: integer("email_id").references(() => emails.id), // If comment was auto-generated from email
  createdAt: timestamp("created_at").defaultNow(),
});

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

// Email correlations for grouping related emails (quotes, invoices, etc)
export const emailCorrelations = pgTable("email_correlations", {
  id: serial("id").primaryKey(),
  groupId: varchar("group_id").notNull(), // UUID for the correlation group
  emailId: integer("email_id").notNull().references(() => emails.id),
  correlationType: varchar("correlation_type").notNull(), // 'quote', 'invoice', 'order', 'inquiry'
  subject: varchar("subject").notNull(), // What the correlation is about
  confidence: real("confidence").default(0.9), // AI confidence in the correlation
  metadata: jsonb("metadata"), // Additional data like price, vendor, etc
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_correlations_group").on(table.groupId),
  index("idx_email_correlations_email").on(table.emailId),
]);

export type EmailCorrelation = typeof emailCorrelations.$inferSelect;
export type InsertEmailCorrelation = typeof emailCorrelations.$inferInsert;

// ============================================
// TEAM MEMBERS & PROJECTS MODULE
// ============================================

// Team members - staff who can be assigned tasks
// Tip: The more detail you provide here, the better the AI can match tasks to the right person
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // Manager who owns this team
  name: varchar("name").notNull(),
  email: varchar("email"),
  jobTitle: varchar("job_title"), // e.g., "Head of Ecommerce", "Warehouse Manager"
  role: varchar("role"), // e.g., "ecommerce", "warehouse", "accounts", "sales"
  responsibilities: text("responsibilities"), // Detailed description of what they handle
  skills: text("skills").array(), // Keywords for AI matching
  signOffLimit: real("sign_off_limit"), // Max amount they can approve (e.g., 500 = £500)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// Projects (like Trello boards / Odoo projects)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["active", "archived", "completed"] }).default("active"),
  color: varchar("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Project stages (kanban columns)
export const projectStages = pgTable("project_stages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: varchar("name").notNull(), // e.g., "Backlog", "In Progress", "Review", "Done"
  position: integer("position").default(0),
  color: varchar("color"),
});

export type ProjectStage = typeof projectStages.$inferSelect;
export type InsertProjectStage = typeof projectStages.$inferInsert;

// User preferences for auto-assignment and AI settings
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  autoAssignEnabled: boolean("auto_assign_enabled").default(false), // Off by default - user must opt-in
  autoApproveThreshold: real("auto_approve_threshold").default(0.95), // Legacy field, keeping for compatibility

  // Phase 1 Launch Plan: Confidence Controls
  confidenceThreshold: real("confidence_threshold").default(0.75), // Global default
  categoryThresholds: jsonb("category_thresholds").$type<{
    finance?: number;
    marketing?: number;
    operations?: number;
    legal?: number;
    external_comms?: number;
  }>().default({
    finance: 0.90,
    external_comms: 0.85,
    operations: 0.75,
    marketing: 0.70
  }),

  defaultProjectId: integer("default_project_id").references(() => projects.id),
  categoryMapping: jsonb("category_mapping").$type<{
    draft: string;
    fyi: string;
    forward: string;
  }>().default({
    draft: "Draft",
    fyi: "FYI",
    forward: "Forward"
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

// Credit usage logs
export const creditLogs = pgTable("credit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // can be negative for deduction, positive for top-up
  action: varchar("action").notNull(), // e.g., 'email_summary', 'task_generation', 'top_up'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CreditLog = typeof creditLogs.$inferSelect;
export type InsertCreditLog = typeof creditLogs.$inferInsert;

// MVP Phase 1: User Style Profiles (for personalized draft generation)
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),

  // Style analysis data
  greetings: text("greetings").array().default([]),
  signoffs: text("signoffs").array().default([]),
  formalityScore: real("formality_score").default(0.5), // 0 = casual, 1 = formal
  verbosity: varchar("verbosity", { enum: ["short", "medium", "long"] }).default("medium"),
  commonPhrases: text("common_phrases").array().default([]),

  // AI rules derived from analysis
  doRules: text("do_rules").array().default([]),
  dontRules: text("dont_rules").array().default([]),

  // Generated prompt for LLM
  stylePrompt: text("style_prompt"),

  // Metrics
  analyzedEmailCount: integer("analyzed_email_count").default(0),

  // Onboarding status
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: integer("onboarding_step").default(0),

  // New onboarding fields
  useCase: varchar("use_case").default("both"), // work | personal | both
  primaryOutcomes: jsonb("primary_outcomes").$type<string[]>().default([]),
  defaultTone: varchar("default_tone").default("neutral"),
  styleLearningOptIn: boolean("style_learning_opt_in").default(true),
  privacyMode: varchar("privacy_mode").default("local_first"),

  // AI Learning Protocols (User corrections & updated thinking)
  learningProtocols: jsonb("learning_protocols").$type<{ trigger: string; correction: string; updatedAt: string }[]>().default([]),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// MVP Phase 8: Audit Logs (for tracking processing history)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // e.g., "Email Ingested", "AI Task Created", "Data Exported", "Decision Approved"
  details: text("details"),
  emailId: integer("email_id"),
  taskId: integer("task_id"),
  decisionId: integer("decision_id").references(() => decisions.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export const insertAuditLogSchema = createInsertSchema(auditLogs);

// Export types for services
export type TriageMetadata = NonNullable<Email["triageMetadata"]>;
