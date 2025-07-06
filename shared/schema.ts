import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
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
