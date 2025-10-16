import { db } from "../db";
import { 
  conversations, 
  messages, 
  userSettings,
  userFeedback,
  users,
  tasks,
  meetings,
  schedules,
  userMemory,
  userTiers,
  agentInteractions,
  agentMessages,
  companies,
  contacts,
  projects,
  communications,
  research,
  analyticsEvents,
  dailyMetrics,
  type InsertConversation, 
  type Conversation, 
  type InsertMessage, 
  type Message,
  type InsertUserSettings,
  type UserSettings,
  type InsertUserFeedback,
  type UserFeedback,
  type User,
  type UpsertUser,
  type InsertTask,
  type Task,
  type InsertMeeting,
  type Meeting,
  type InsertSchedule,
  type Schedule,
  type InsertUserMemory,
  type UserMemory,
  type InsertUserTier,
  type UserTier,
  type InsertAgentInteraction,
  type AgentInteraction,
  type InsertAgentMessage,
  type AgentMessage,
  type InsertCompany,
  type Company,
  type InsertContact,
  type Contact,
  type InsertProject,
  type Project,
  type InsertCommunication,
  type Communication,
  type InsertResearch,
  type Research,
  type InsertAnalyticsEvent,
  type AnalyticsEvent,
  type InsertDailyMetrics,
  type DailyMetrics
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users (for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Conversations
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(data: InsertConversation): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  
  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  
  // User Settings
  getUserSettings(userId?: string): Promise<UserSettings | undefined>;
  createOrUpdateUserSettings(data: InsertUserSettings): Promise<UserSettings>;
  
  // User Feedback
  createFeedback(data: InsertUserFeedback): Promise<UserFeedback>;
  getFeedbackByMessage(messageId: string): Promise<UserFeedback[]>;
  
  // MeetingMate Organization Features
  // Tasks
  getTasks(userId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Meetings
  getMeetings(userId?: string): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  createMeeting(data: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, data: Partial<InsertMeeting>): Promise<Meeting>;
  deleteMeeting(id: string): Promise<void>;
  
  // Schedules
  getSchedules(userId?: string): Promise<Schedule[]>;
  getSchedule(id: string): Promise<Schedule | undefined>;
  createSchedule(data: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, data: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;
  
  // User Memory - Cross-Conversation Context
  getUserMemories(userId?: string): Promise<UserMemory[]>;
  getUserMemoriesByCategory(userId: string, category: string): Promise<UserMemory[]>;
  createUserMemory(data: InsertUserMemory): Promise<UserMemory>;
  updateUserMemory(id: string, data: Partial<InsertUserMemory>): Promise<UserMemory>;
  deleteUserMemory(id: string): Promise<void>;
  
  // User Tiers
  getUserTier(userId?: string): Promise<UserTier | undefined>;
  createOrUpdateUserTier(data: InsertUserTier): Promise<UserTier>;
  
  // Agent Interactions
  getAgentInteractions(userId?: string): Promise<AgentInteraction[]>;
  createAgentInteraction(data: InsertAgentInteraction): Promise<AgentInteraction>;
  
  // Phase 3.2: Agent-to-Agent Communication
  getAgentMessages(filters: {
    conversationId?: string;
    fromAgent?: string;
    toAgent?: string;
    status?: string;
    limit?: number;
  }): Promise<AgentMessage[]>;
  getAgentMessage(id: string): Promise<AgentMessage | undefined>;
  createAgentMessage(data: InsertAgentMessage): Promise<AgentMessage>;
  updateAgentMessage(id: string, data: Partial<InsertAgentMessage> & { completedAt?: Date }): Promise<AgentMessage>;
  
  // CRM - Companies
  getCompanies(userId?: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;
  updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  
  // CRM - Contacts
  getContacts(userId?: string): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  getContactsByCompany(companyId: string): Promise<Contact[]>;
  createContact(data: InsertContact): Promise<Contact>;
  updateContact(id: string, data: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  
  // CRM - Projects
  getProjects(userId?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByContact(contactId: string): Promise<Project[]>;
  getProjectsByCompany(companyId: string): Promise<Project[]>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // CRM - Communications
  getCommunications(userId?: string): Promise<Communication[]>;
  getCommunication(id: string): Promise<Communication | undefined>;
  getCommunicationsByContact(contactId: string): Promise<Communication[]>;
  getCommunicationsByProject(projectId: string): Promise<Communication[]>;
  createCommunication(data: InsertCommunication): Promise<Communication>;
  updateCommunication(id: string, data: Partial<InsertCommunication>): Promise<Communication>;
  deleteCommunication(id: string): Promise<void>;
  
  // CRM - Research
  getResearch(userId?: string): Promise<Research[]>;
  getResearchItem(id: string): Promise<Research | undefined>;
  getResearchByContact(contactId: string): Promise<Research[]>;
  getResearchByCompany(companyId: string): Promise<Research[]>;
  getResearchByProject(projectId: string): Promise<Research[]>;
  createResearch(data: InsertResearch): Promise<Research>;
  updateResearch(id: string, data: Partial<InsertResearch>): Promise<Research>;
  deleteResearch(id: string): Promise<void>;
  
  // Analytics & Telemetry
  createAnalyticsEvent(data: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(filters: {
    userId?: string;
    eventType?: string;
    agentId?: string;
    toolName?: string;
    limit?: number;
  }): Promise<AnalyticsEvent[]>;
  getDailyMetrics(days?: number): Promise<DailyMetrics[]>;
  createOrUpdateDailyMetrics(date: Date, data: Partial<InsertDailyMetrics>): Promise<DailyMetrics>;
}

export class DbStorage implements IStorage {
  // Users (for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async createConversation(data: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(data).returning();
    return result[0];
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(data).returning();
    
    // Update conversation's updatedAt timestamp
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, data.conversationId));
    
    return result[0];
  }

  // User Settings
  async getUserSettings(userId: string = 'default_user'): Promise<UserSettings | undefined> {
    const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return result[0];
  }

  async createOrUpdateUserSettings(data: InsertUserSettings): Promise<UserSettings> {
    const userId = data.userId || 'default_user';
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const result = await db.update(userSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(userSettings).values({ ...data, userId }).returning();
      return result[0];
    }
  }

  // User Feedback
  async createFeedback(data: InsertUserFeedback): Promise<UserFeedback> {
    const result = await db.insert(userFeedback).values(data).returning();
    return result[0];
  }

  async getFeedbackByMessage(messageId: string): Promise<UserFeedback[]> {
    return await db.select().from(userFeedback)
      .where(eq(userFeedback.messageId, messageId))
      .orderBy(desc(userFeedback.createdAt));
  }

  // MeetingMate Organization Features
  // Tasks
  async getTasks(userId: string = 'default_user'): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async createTask(data: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task> {
    const result = await db.update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Meetings
  async getMeetings(userId: string = 'default_user'): Promise<Meeting[]> {
    return await db.select().from(meetings)
      .where(eq(meetings.userId, userId))
      .orderBy(desc(meetings.meetingDate));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const result = await db.select().from(meetings).where(eq(meetings.id, id));
    return result[0];
  }

  async createMeeting(data: InsertMeeting): Promise<Meeting> {
    const result = await db.insert(meetings).values(data).returning();
    return result[0];
  }

  async updateMeeting(id: string, data: Partial<InsertMeeting>): Promise<Meeting> {
    const result = await db.update(meetings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return result[0];
  }

  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // Schedules
  async getSchedules(userId: string = 'default_user'): Promise<Schedule[]> {
    return await db.select().from(schedules)
      .where(eq(schedules.userId, userId))
      .orderBy(desc(schedules.scheduledTime));
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    const result = await db.select().from(schedules).where(eq(schedules.id, id));
    return result[0];
  }

  async createSchedule(data: InsertSchedule): Promise<Schedule> {
    const result = await db.insert(schedules).values(data).returning();
    return result[0];
  }

  async updateSchedule(id: string, data: Partial<InsertSchedule>): Promise<Schedule> {
    const result = await db.update(schedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return result[0];
  }

  async deleteSchedule(id: string): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  // User Memory - Cross-Conversation Context
  async getUserMemories(userId: string = 'default_user'): Promise<UserMemory[]> {
    return await db.select().from(userMemory)
      .where(eq(userMemory.userId, userId))
      .orderBy(desc(userMemory.importance), desc(userMemory.updatedAt));
  }

  async getUserMemoriesByCategory(userId: string, category: string): Promise<UserMemory[]> {
    return await db.select().from(userMemory)
      .where(and(
        eq(userMemory.userId, userId),
        eq(userMemory.category, category)
      ))
      .orderBy(desc(userMemory.importance), desc(userMemory.updatedAt));
  }

  async createUserMemory(data: InsertUserMemory): Promise<UserMemory> {
    const result = await db.insert(userMemory).values(data).returning();
    return result[0];
  }

  async updateUserMemory(id: string, data: Partial<InsertUserMemory>): Promise<UserMemory> {
    const result = await db.update(userMemory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userMemory.id, id))
      .returning();
    return result[0];
  }

  async deleteUserMemory(id: string): Promise<void> {
    await db.delete(userMemory).where(eq(userMemory.id, id));
  }

  // User Tiers
  async getUserTier(userId: string = 'default_user'): Promise<UserTier | undefined> {
    const result = await db.select().from(userTiers).where(eq(userTiers.userId, userId));
    return result[0];
  }

  async createOrUpdateUserTier(data: InsertUserTier): Promise<UserTier> {
    const result = await db
      .insert(userTiers)
      .values(data)
      .onConflictDoUpdate({
        target: userTiers.userId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Agent Interactions
  async getAgentInteractions(userId: string = 'default_user'): Promise<AgentInteraction[]> {
    return await db.select().from(agentInteractions)
      .where(eq(agentInteractions.userId, userId))
      .orderBy(desc(agentInteractions.createdAt));
  }

  async createAgentInteraction(data: InsertAgentInteraction): Promise<AgentInteraction> {
    const result = await db.insert(agentInteractions).values(data).returning();
    return result[0];
  }

  // ============ PHASE 3.2: AGENT-TO-AGENT COMMUNICATION ============
  
  async getAgentMessages(filters: {
    conversationId?: string;
    fromAgent?: string;
    toAgent?: string;
    status?: string;
    limit?: number;
  }): Promise<AgentMessage[]> {
    let query = db.select().from(agentMessages);
    
    const conditions = [];
    if (filters.conversationId) {
      conditions.push(eq(agentMessages.conversationId, filters.conversationId));
    }
    if (filters.fromAgent) {
      conditions.push(eq(agentMessages.fromAgent, filters.fromAgent));
    }
    if (filters.toAgent) {
      conditions.push(eq(agentMessages.toAgent, filters.toAgent));
    }
    if (filters.status) {
      conditions.push(eq(agentMessages.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(agentMessages.createdAt)) as any;
    
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }
  
  async getAgentMessage(id: string): Promise<AgentMessage | undefined> {
    const result = await db.select().from(agentMessages).where(eq(agentMessages.id, id));
    return result[0];
  }
  
  async createAgentMessage(data: InsertAgentMessage): Promise<AgentMessage> {
    const result = await db.insert(agentMessages).values(data).returning();
    return result[0];
  }
  
  async updateAgentMessage(
    id: string, 
    data: Partial<InsertAgentMessage> & { completedAt?: Date }
  ): Promise<AgentMessage> {
    const result = await db
      .update(agentMessages)
      .set(data)
      .where(eq(agentMessages.id, id))
      .returning();
    return result[0];
  }

  // ============ CRM OPERATIONS ============
  
  // Companies
  async getCompanies(userId: string = 'default_user'): Promise<Company[]> {
    return await db.select().from(companies)
      .where(eq(companies.userId, userId))
      .orderBy(desc(companies.createdAt));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id));
    return result[0];
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(data).returning();
    return result[0];
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company> {
    const result = await db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Contacts
  async getContacts(userId: string = 'default_user'): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.lastContactDate));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id));
    return result[0];
  }

  async getContactsByCompany(companyId: string): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(eq(contacts.companyId, companyId))
      .orderBy(desc(contacts.createdAt));
  }

  async createContact(data: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(data).returning();
    return result[0];
  }

  async updateContact(id: string, data: Partial<InsertContact>): Promise<Contact> {
    const result = await db
      .update(contacts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Projects
  async getProjects(userId: string = 'default_user'): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getProjectsByContact(contactId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.contactId, contactId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectsByCompany(companyId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.companyId, companyId))
      .orderBy(desc(projects.createdAt));
  }

  async createProject(data: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(data).returning();
    return result[0];
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project> {
    const result = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Communications
  async getCommunications(userId: string = 'default_user'): Promise<Communication[]> {
    return await db.select().from(communications)
      .where(eq(communications.userId, userId))
      .orderBy(desc(communications.communicationDate));
  }

  async getCommunication(id: string): Promise<Communication | undefined> {
    const result = await db.select().from(communications).where(eq(communications.id, id));
    return result[0];
  }

  async getCommunicationsByContact(contactId: string): Promise<Communication[]> {
    return await db.select().from(communications)
      .where(eq(communications.contactId, contactId))
      .orderBy(desc(communications.communicationDate));
  }

  async getCommunicationsByProject(projectId: string): Promise<Communication[]> {
    return await db.select().from(communications)
      .where(eq(communications.projectId, projectId))
      .orderBy(desc(communications.communicationDate));
  }

  async createCommunication(data: InsertCommunication): Promise<Communication> {
    const result = await db.insert(communications).values(data).returning();
    return result[0];
  }

  async updateCommunication(id: string, data: Partial<InsertCommunication>): Promise<Communication> {
    const result = await db
      .update(communications)
      .set(data)
      .where(eq(communications.id, id))
      .returning();
    return result[0];
  }

  async deleteCommunication(id: string): Promise<void> {
    await db.delete(communications).where(eq(communications.id, id));
  }

  // Research
  async getResearch(userId: string = 'default_user'): Promise<Research[]> {
    return await db.select().from(research)
      .where(eq(research.userId, userId))
      .orderBy(desc(research.createdAt));
  }

  async getResearchItem(id: string): Promise<Research | undefined> {
    const result = await db.select().from(research).where(eq(research.id, id));
    return result[0];
  }

  async getResearchByContact(contactId: string): Promise<Research[]> {
    return await db.select().from(research)
      .where(eq(research.contactId, contactId))
      .orderBy(desc(research.createdAt));
  }

  async getResearchByCompany(companyId: string): Promise<Research[]> {
    return await db.select().from(research)
      .where(eq(research.companyId, companyId))
      .orderBy(desc(research.createdAt));
  }

  async getResearchByProject(projectId: string): Promise<Research[]> {
    return await db.select().from(research)
      .where(eq(research.projectId, projectId))
      .orderBy(desc(research.createdAt));
  }

  async createResearch(data: InsertResearch): Promise<Research> {
    const result = await db.insert(research).values(data).returning();
    return result[0];
  }

  async updateResearch(id: string, data: Partial<InsertResearch>): Promise<Research> {
    const result = await db
      .update(research)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(research.id, id))
      .returning();
    return result[0];
  }

  async deleteResearch(id: string): Promise<void> {
    await db.delete(research).where(eq(research.id, id));
  }

  // Analytics & Telemetry
  async createAnalyticsEvent(data: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [event] = await db.insert(analyticsEvents).values(data).returning();
    return event;
  }

  async getAnalyticsEvents(filters: {
    userId?: string;
    eventType?: string;
    agentId?: string;
    toolName?: string;
    limit?: number;
  }): Promise<AnalyticsEvent[]> {
    const conditions = [];
    
    if (filters.userId) {
      conditions.push(eq(analyticsEvents.userId, filters.userId));
    }
    if (filters.eventType) {
      conditions.push(eq(analyticsEvents.eventType, filters.eventType));
    }
    if (filters.agentId) {
      conditions.push(eq(analyticsEvents.agentId, filters.agentId));
    }
    if (filters.toolName) {
      conditions.push(eq(analyticsEvents.toolName, filters.toolName));
    }

    let query = db.select().from(analyticsEvents);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(analyticsEvents.createdAt)) as any;

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getDailyMetrics(days: number = 30): Promise<DailyMetrics[]> {
    return await db.select()
      .from(dailyMetrics)
      .orderBy(desc(dailyMetrics.date))
      .limit(days);
  }

  async createOrUpdateDailyMetrics(date: Date, data: Partial<InsertDailyMetrics>): Promise<DailyMetrics> {
    const [metric] = await db
      .insert(dailyMetrics)
      .values({ ...data, date })
      .onConflictDoUpdate({
        target: dailyMetrics.date,
        set: data,
      })
      .returning();
    return metric;
  }
}

export const storage = new DbStorage();
