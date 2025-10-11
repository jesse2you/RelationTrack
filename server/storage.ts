import { type Contact, type InsertContact, type Activity, type InsertActivity, contacts, activities } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "../db";
import { eq, or, ilike, arrayContains, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Contacts
  getAllContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: InsertContact): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;
  markContactedToday(id: string): Promise<Contact | undefined>;
  searchContacts(query: string): Promise<Contact[]>;
  
  // Activities
  getContactActivities(contactId: string): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<(Activity & { contactName: string })[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private contacts: Map<string, Contact>;
  private activities: Map<string, Activity>;

  constructor() {
    this.contacts = new Map();
    this.activities = new Map();
  }

  async getAllContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = {
      ...insertContact,
      id,
      lastContactDate: insertContact.lastContactDate || null,
      nextTouchDate: insertContact.nextTouchDate || null,
      company: insertContact.company || null,
      email: insertContact.email || null,
      phone: insertContact.phone || null,
      notes: insertContact.notes || null,
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(
    id: string,
    insertContact: InsertContact
  ): Promise<Contact | undefined> {
    const existing = this.contacts.get(id);
    if (!existing) return undefined;

    const updated: Contact = {
      ...existing,
      ...insertContact,
      id,
      lastContactDate: insertContact.lastContactDate || null,
      nextTouchDate: insertContact.nextTouchDate || null,
      company: insertContact.company || null,
      email: insertContact.email || null,
      phone: insertContact.phone || null,
      notes: insertContact.notes || null,
    };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async markContactedToday(id: string): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;

    const updated: Contact = {
      ...contact,
      lastContactDate: new Date(),
    };
    this.contacts.set(id, updated);
    return updated;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.contacts.values()).filter((contact) => {
      return (
        contact.name.toLowerCase().includes(lowerQuery) ||
        contact.company?.toLowerCase().includes(lowerQuery) ||
        contact.email?.toLowerCase().includes(lowerQuery) ||
        contact.phone?.toLowerCase().includes(lowerQuery) ||
        contact.notes?.toLowerCase().includes(lowerQuery) ||
        contact.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  async getContactActivities(contactId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.contactId === contactId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentActivities(limit: number = 10): Promise<(Activity & { contactName: string })[]> {
    const sortedActivities = Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return sortedActivities.map(activity => {
      const contact = this.contacts.get(activity.contactId);
      return {
        ...activity,
        contactName: contact?.name || 'Unknown Contact',
      };
    });
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      notes: insertActivity.notes || null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export class DbStorage implements IStorage {
  async getAllContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id));
    return result[0];
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(insertContact).returning();
    return result[0];
  }

  async updateContact(
    id: string,
    insertContact: InsertContact
  ): Promise<Contact | undefined> {
    const result = await db
      .update(contacts)
      .set(insertContact)
      .where(eq(contacts.id, id))
      .returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id)).returning();
    return result.length > 0;
  }

  async markContactedToday(id: string): Promise<Contact | undefined> {
    const result = await db
      .update(contacts)
      .set({ lastContactDate: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return result[0];
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(contacts)
      .where(
        or(
          ilike(contacts.name, searchPattern),
          ilike(contacts.company, searchPattern),
          ilike(contacts.email, searchPattern),
          ilike(contacts.phone, searchPattern),
          ilike(contacts.notes, searchPattern),
          sql`EXISTS (SELECT 1 FROM unnest(${contacts.tags}) AS tag WHERE LOWER(tag) LIKE LOWER(${searchPattern}))`
        )
      );
  }

  async getContactActivities(contactId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.contactId, contactId))
      .orderBy(desc(activities.createdAt));
  }

  async getRecentActivities(limit: number = 10): Promise<(Activity & { contactName: string })[]> {
    const results = await db
      .select({
        id: activities.id,
        contactId: activities.contactId,
        type: activities.type,
        description: activities.description,
        notes: activities.notes,
        createdAt: activities.createdAt,
        contactName: contacts.name,
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r,
      contactName: r.contactName || 'Unknown Contact',
    }));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(insertActivity).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
