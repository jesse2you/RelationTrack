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
  type AgentInteraction
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
}

export const storage = new DbStorage();
