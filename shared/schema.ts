import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, boolean, integer } from "drizzle-orm/pg-core";
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

// Tool Usage Tracking - Track tool/module usage per user for tier limits
export const toolUsage = pgTable("tool_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  toolName: text("tool_name").notNull(), // 'web_search', 'gmail_api', 'calendar_api', etc
  usageCount: integer("usage_count").notNull().default(1),
  lastUsed: timestamp("last_used").notNull().default(sql`now()`),
  dailyCount: integer("daily_count").notNull().default(1), // Resets daily
  monthlyCount: integer("monthly_count").notNull().default(1), // Resets monthly
  resetDate: timestamp("reset_date").notNull().default(sql`now()`),
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

export const insertToolUsageSchema = createInsertSchema(toolUsage).omit({
  id: true,
  lastUsed: true,
  resetDate: true,
});

export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type UserMemory = typeof userMemory.$inferSelect;
export type InsertUserTier = z.infer<typeof insertUserTierSchema>;
export type UserTier = typeof userTiers.$inferSelect;
export type InsertAgentInteraction = z.infer<typeof insertAgentInteractionSchema>;
export type AgentInteraction = typeof agentInteractions.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertToolUsage = z.infer<typeof insertToolUsageSchema>;
export type ToolUsage = typeof toolUsage.$inferSelect;

// ============ CRM TABLES - RelationTrack Features ============

// Companies - Organization information
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  companyName: text("company_name").notNull(),
  website: text("website"),
  industry: text("industry"),
  size: text("size"), // 'small', 'medium', 'large', 'enterprise'
  annualRevenue: text("annual_revenue"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => [
  index("idx_company_name").on(table.companyName),
  index("idx_company_industry").on(table.industry),
  index("idx_company_user").on(table.userId),
]);

// Contacts - Centralized contact information
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  department: text("department"),
  leadSource: text("lead_source"), // 'referral', 'web', 'event', 'cold_outreach'
  status: text("status").default('active'), // 'active', 'inactive', 'converted', 'lost'
  customerType: text("customer_type"), // 'prospect', 'customer', 'partner'
  lastContactDate: timestamp("last_contact_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => [
  index("idx_contact_email").on(table.email),
  index("idx_contact_company").on(table.companyId),
  index("idx_contact_status").on(table.status),
  index("idx_contact_user").on(table.userId),
  index("idx_contact_name").on(table.lastName, table.firstName),
  index("idx_last_contact_date").on(table.lastContactDate),
]);

// Projects - Project metadata and tracking
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  contactId: varchar("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }),
  projectName: text("project_name").notNull(),
  description: text("description"),
  category: text("category"), // 'sales', 'support', 'partnership', 'internal'
  projectValue: text("project_value"), // Monetary value if applicable
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default('planning'), // 'planning', 'active', 'on_hold', 'completed', 'cancelled'
  priority: text("priority").default('medium'), // 'low', 'medium', 'high', 'urgent'
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => [
  index("idx_project_contact").on(table.contactId),
  index("idx_project_company").on(table.companyId),
  index("idx_project_status").on(table.status),
  index("idx_project_owner").on(table.ownerId),
  index("idx_project_dates").on(table.startDate, table.endDate),
  index("idx_project_user").on(table.userId),
]);

// Communications - Emails, SMS, calls, meetings logged
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  contactId: varchar("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  communicationType: text("communication_type").notNull(), // 'email', 'sms', 'call', 'meeting', 'other'
  direction: text("direction").notNull(), // 'inbound', 'outbound'
  subject: text("subject"),
  content: text("content"),
  communicationDate: timestamp("communication_date").notNull().default(sql`now()`),
  durationMinutes: integer("duration_minutes"), // For calls/meetings
  outcome: text("outcome"), // 'successful', 'no_answer', 'follow_up_needed'
  metadata: jsonb("metadata"), // Additional structured data (email headers, SMS delivery status, etc)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => [
  index("idx_comm_contact").on(table.contactId),
  index("idx_comm_project").on(table.projectId),
  index("idx_comm_type").on(table.communicationType),
  index("idx_comm_date").on(table.communicationDate),
  index("idx_comm_contact_date").on(table.contactId, table.communicationDate),
  index("idx_comm_user").on(table.userId),
]);

// Research - Research summaries, sources, and insights
export const research = pgTable("research", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  contactId: varchar("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  sources: text("sources").array(), // Array of URLs or references
  findings: text("findings"), // Key insights
  researchType: text("research_type"), // 'market', 'competitor', 'customer', 'technical'
  tags: text("tags").array(),
  isPinned: boolean("is_pinned").default(false),
  agentSource: text("agent_source"), // Which agent generated this
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => [
  index("idx_research_contact").on(table.contactId),
  index("idx_research_company").on(table.companyId),
  index("idx_research_project").on(table.projectId),
  index("idx_research_type").on(table.researchType),
  index("idx_research_created").on(table.createdAt),
  index("idx_research_user").on(table.userId),
]);

// Phase 3.2: Agent-to-Agent Communication
export const agentMessages = pgTable("agent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  fromAgent: text("from_agent").notNull(), // Agent ID sending the message
  toAgent: text("to_agent").notNull(), // Agent ID receiving the message
  taskType: text("task_type").notNull(), // 'research', 'analysis', 'learning', 'task_creation'
  taskData: jsonb("task_data").notNull(), // Task details and context
  status: text("status").notNull().default('pending'), // 'pending' | 'in_progress' | 'completed' | 'failed'
  result: text("result"), // Task result when completed
  error: text("error"), // Error message if failed
  priority: integer("priority").default(1), // 1-5, higher = more urgent
  parentStepNumber: integer("parent_step_number"), // Which orchestration step created this
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_agent_msg_conversation").on(table.conversationId),
  index("idx_agent_msg_from").on(table.fromAgent),
  index("idx_agent_msg_to").on(table.toAgent),
  index("idx_agent_msg_status").on(table.status),
  index("idx_agent_msg_created").on(table.createdAt),
]);

// Insert schemas for new CRM tables
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

export const insertResearchSchema = createInsertSchema(research).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for CRM tables
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertResearch = z.infer<typeof insertResearchSchema>;
export type Research = typeof research.$inferSelect;

// Phase 3.2: Agent Messages
export const insertAgentMessageSchema = createInsertSchema(agentMessages).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;
export type AgentMessage = typeof agentMessages.$inferSelect;
