import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertActivitySchema, type Contact } from "@shared/schema";
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

  // Export contacts as CSV
  app.get("/api/contacts/export/csv", async (_req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      
      // CSV headers
      const headers = ["Name", "Company", "Email", "Phone", "Notes", "Last Contact Date", "Next Touch Date", "Tags"];
      const csvRows = [headers.join(",")];
      
      // CSV data
      for (const contact of contacts) {
        const row = [
          escapeCSV(contact.name),
          escapeCSV(contact.company || ""),
          escapeCSV(contact.email || ""),
          escapeCSV(contact.phone || ""),
          escapeCSV(contact.notes || ""),
          contact.lastContactDate ? new Date(contact.lastContactDate).toISOString() : "",
          contact.nextTouchDate ? new Date(contact.nextTouchDate).toISOString() : "",
          escapeCSV(contact.tags?.join("; ") || ""),
        ];
        csvRows.push(row.join(","));
      }
      
      const csv = csvRows.join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export contacts" });
    }
  });

  // Export contacts as JSON
  app.get("/api/contacts/export/json", async (_req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      const json = JSON.stringify(contacts, null, 2);
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.json"`);
      res.setHeader("Content-Length", Buffer.byteLength(json).toString());
      res.send(json);
    } catch (error) {
      res.status(500).json({ error: "Failed to export contacts" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
