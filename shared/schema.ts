import { pgTable, text, serial, integer, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
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
