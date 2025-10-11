import { type Contact, type InsertContact } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Contacts
  getAllContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: InsertContact): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;
  markContactedToday(id: string): Promise<Contact | undefined>;
}

export class MemStorage implements IStorage {
  private contacts: Map<string, Contact>;

  constructor() {
    this.contacts = new Map();
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
}

export const storage = new MemStorage();
