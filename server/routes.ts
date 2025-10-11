import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertActivitySchema, type Contact, type InsertContact } from "@shared/schema";
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

  // Import contacts from JSON or CSV
  app.post("/api/contacts/import", async (req, res) => {
    try {
      const { data, format } = req.body;
      
      if (!data || !format) {
        return res.status(400).json({ error: "Missing data or format" });
      }

      let contacts: any[];
      
      if (format === "json") {
        // Parse JSON data
        try {
          contacts = typeof data === "string" ? JSON.parse(data) : data;
        } catch (error) {
          return res.status(400).json({ error: "Invalid JSON format" });
        }
      } else if (format === "csv") {
        // Parse CSV data
        contacts = parseCSV(data);
      } else {
        return res.status(400).json({ error: "Unsupported format. Use 'json' or 'csv'" });
      }

      if (!Array.isArray(contacts)) {
        return res.status(400).json({ error: "Data must be an array of contacts" });
      }

      const results = {
        imported: 0,
        failed: 0,
        errors: [] as Array<{ row: number; error: string; data: any }>,
      };

      for (let i = 0; i < contacts.length; i++) {
        const contactData = contacts[i];
        try {
          // Extract and parse dates
          const lastContactDateStr = contactData.lastContactDate || contactData["Last Contact Date"];
          const nextTouchDateStr = contactData.nextTouchDate || contactData["Next Touch Date"];
          
          // Parse dates to ISO strings if valid
          let lastContactDate = undefined;
          if (lastContactDateStr && lastContactDateStr.trim() !== "") {
            const parsedDate = new Date(lastContactDateStr);
            if (!isNaN(parsedDate.getTime())) {
              lastContactDate = parsedDate;
            }
          }
          
          let nextTouchDate = undefined;
          if (nextTouchDateStr && nextTouchDateStr.trim() !== "") {
            const parsedDate = new Date(nextTouchDateStr);
            if (!isNaN(parsedDate.getTime())) {
              nextTouchDate = parsedDate;
            }
          }
          
          // Validate and sanitize data
          const validated = insertContactSchema.parse({
            name: contactData.name || contactData.Name,
            company: contactData.company || contactData.Company || undefined,
            email: contactData.email || contactData.Email || undefined,
            phone: contactData.phone || contactData.Phone || undefined,
            notes: contactData.notes || contactData.Notes || undefined,
            lastContactDate,
            nextTouchDate,
            tags: Array.isArray(contactData.tags) 
              ? contactData.tags 
              : (contactData.tags || contactData.Tags)
                ? String(contactData.tags || contactData.Tags).split(/[;,]/).map(t => t.trim()).filter(Boolean)
                : [],
          });

          const contact = await storage.createContact(validated);
          
          // Only log activity if contact was successfully created
          if (contact && contact.id) {
            await storage.createActivity({
              contactId: contact.id,
              type: "created",
              description: "Contact imported",
              notes: null,
            });
          }
          
          results.imported++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: error instanceof z.ZodError ? error.errors.map(e => e.message).join(", ") : "Invalid data",
            data: contactData,
          });
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to import contacts" });
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

// Helper function to parse CSV into objects
function parseCSV(csvText: string): any[] {
  // Normalize line endings to \n
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalizedText) return [];
  
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;
  
  // First pass: split into lines respecting quoted fields
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    
    if (char === '"') {
      if (insideQuotes && normalizedText[i + 1] === '"') {
        currentLine += '""';
        i++;
      } else {
        insideQuotes = !insideQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length < 2) return [];
  
  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const results: any[] = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    results.push(row);
  }
  
  return results;
}

// Helper function to parse a single CSV line
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);
  
  return values.map(v => v.trim().replace(/^"|"$/g, ''));
}
