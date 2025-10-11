import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  nextTouchDate: timestamp("next_touch_date"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
}).extend({
  tags: z.array(z.string()).default([]),
  lastContactDate: z.union([z.date(), z.string().datetime()]).optional().transform(val => val ? new Date(val) : undefined),
  nextTouchDate: z.union([z.date(), z.string().datetime()]).optional().transform(val => val ? new Date(val) : undefined),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
