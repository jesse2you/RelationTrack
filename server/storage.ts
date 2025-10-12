import { db } from "../db";
import { 
  conversations, 
  messages, 
  userSettings,
  userFeedback,
  users,
  type InsertConversation, 
  type Conversation, 
  type InsertMessage, 
  type Message,
  type InsertUserSettings,
  type UserSettings,
  type InsertUserFeedback,
  type UserFeedback,
  type User,
  type UpsertUser
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DbStorage();
