import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Search contacts
  app.get("/api/contacts/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === "") {
        return res.json([]);
      }
      const contacts = await storage.searchContacts(query);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to search contacts" });
    }
  });

  // Get all contacts
  app.get("/api/contacts", async (_req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Get a specific contact
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  // Create a new contact
  app.post("/api/contacts", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      
      // Log activity
      await storage.createActivity({
        contactId: contact.id,
        type: "created",
        description: "Contact created",
        notes: null,
      });
      
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  // Update a contact
  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.updateContact(req.params.id, data);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      // Log activity
      await storage.createActivity({
        contactId: req.params.id,
        type: "update",
        description: "Contact information updated",
        notes: null,
      });
      
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  // Delete a contact
  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteContact(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Mark contact as contacted today
  app.post("/api/contacts/:id/contacted", async (req, res) => {
    try {
      const contact = await storage.markContactedToday(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      // Log activity
      await storage.createActivity({
        contactId: req.params.id,
        type: "contact",
        description: "Marked as contacted today",
        notes: null,
      });
      
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark contact as contacted" });
    }
  });

  // Get contact activities
  app.get("/api/contacts/:id/activities", async (req, res) => {
    try {
      const activities = await storage.getContactActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
