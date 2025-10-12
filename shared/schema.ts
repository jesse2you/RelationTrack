import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  aiProvider: text("ai_provider"), // which AI was used: 'openai', 'claude', 'gemini'
  model: text("model"), // specific model used
  agentRole: text("agent_role"), // specialized agent: 'coordinator', 'learning_coach', 'teaching_assistant', 'research_agent'
  taskType: text("task_type"), // type of task: 'learning', 'teaching', 'research', 'general'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// User settings for customization
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'), // For multi-user support later
  preferredModel: text("preferred_model"), // User's default model choice
  customRouting: text("custom_routing"), // JSON string of custom routing rules
  themePreference: text("theme_preference").default('system'), // 'light', 'dark', 'system'
  showHelpTips: text("show_help_tips").default('true'), // 'true' or 'false'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User feedback for collaborative improvement
export const userFeedback = pgTable("user_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id, { onDelete: "cascade" }),
  feedbackType: text("feedback_type").notNull(), // 'thumbs_up', 'thumbs_down', 'suggestion', 'bug'
  content: text("content"), // Detailed feedback or suggestion
  suggestedModel: text("suggested_model"), // If user thinks different model should be used
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;

// Session storage for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// MeetingMate Organization Features
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed'
  priority: text("priority").default('medium'), // 'low', 'medium', 'high'
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  title: text("title").notNull(),
  notes: text("notes"),
  participants: text("participants").array(),
  meetingDate: timestamp("meeting_date").notNull(),
  duration: text("duration"), // e.g., "30 minutes", "1 hour"
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  title: text("title").notNull(),
  description: text("description"),
  scheduledTime: timestamp("scheduled_time").notNull(),
  recurrence: text("recurrence"), // 'once', 'daily', 'weekly', 'monthly'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// User Memory System - Cross-Conversation Context
export const userMemory = pgTable("user_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  memoryType: text("memory_type").notNull(), // 'goal', 'preference', 'fact', 'context'
  category: text("category"), // 'learning', 'work', 'personal', 'skills'
  content: text("content").notNull(), // The actual memory/fact
  importance: text("importance").default('medium'), // 'low', 'medium', 'high'
  sourceAgent: text("source_agent"), // Which agent learned this
  sourceConversationId: varchar("source_conversation_id").references(() => conversations.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User Tier System - Subscription Levels
export const userTiers = pgTable("user_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().default('default_user'),
  tier: text("tier").notNull().default('free'), // 'free', 'pro', 'premium'
  features: text("features").array(), // List of enabled features
  customizationLevel: text("customization_level").default('basic'), // 'basic', 'advanced', 'full'
  agentAccess: text("agent_access").array(), // Which agents user can access
  messagesPerMonth: text("messages_per_month").default('100'), // Message limit
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Agent Interaction Log - Track agent collaboration
export const agentInteractions = pgTable("agent_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  primaryAgent: text("primary_agent").notNull(), // Main agent handling request
  collaboratingAgents: text("collaborating_agents").array(), // Other agents involved
  interactionType: text("interaction_type"), // 'solo', 'handoff', 'collaborative'
  outcome: text("outcome"), // What was accomplished
  memoryCreated: boolean("memory_created").default(false), // Did this create user memory?
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Agent Tasks - Assigned tasks for agent orchestration
export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  agentId: text("agent_id").notNull(), // Which agent is assigned
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default('medium'), // 'low', 'medium', 'high'
  status: text("status").default('pending'), // 'pending', 'in_progress', 'completed', 'failed'
  result: text("result"), // Agent's execution result
  conversationId: varchar("conversation_id").references(() => conversations.id), // If task created a conversation
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

export const insertUserMemorySchema = createInsertSchema(userMemory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTierSchema = createInsertSchema(userTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentInteractionSchema = createInsertSchema(agentInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type UserMemory = typeof userMemory.$inferSelect;
export type InsertUserTier = z.infer<typeof insertUserTierSchema>;
export type UserTier = typeof userTiers.$inferSelect;
export type InsertAgentInteraction = z.infer<typeof insertAgentInteractionSchema>;
export type AgentInteraction = typeof agentInteractions.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
