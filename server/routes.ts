import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "../db";
import { insertConversationSchema, insertMessageSchema, insertUserSettingsSchema, insertUserFeedbackSchema, userFeedback, users } from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import OpenAI from "openai";
import { analyzeAndRoute, generateAgentResponse, AGENTS } from "./agentCoordinator";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const server = createServer(app);

  // Get all conversations
  app.get("/api/conversations", async (_req, res) => {
    const conversations = await storage.getConversations();
    res.json(conversations);
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    const data = insertConversationSchema.parse(req.body);
    const conversation = await storage.createConversation(data);
    res.json(conversation);
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    const messages = await storage.getMessages(req.params.id);
    res.json(messages);
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    await storage.deleteConversation(req.params.id);
    res.json({ success: true });
  });

  // User Settings Routes
  app.get("/api/settings", async (_req, res) => {
    const settings = await storage.getUserSettings();
    res.json(settings || {});
  });

  app.post("/api/settings", async (req, res) => {
    const data = insertUserSettingsSchema.parse(req.body);
    const settings = await storage.createOrUpdateUserSettings(data);
    res.json(settings);
  });

  // User Feedback Routes
  app.post("/api/feedback", async (req, res) => {
    const data = insertUserFeedbackSchema.parse(req.body);
    const feedback = await storage.createFeedback(data);
    res.json(feedback);
  });

  app.get("/api/feedback/:messageId", async (req, res) => {
    const feedback = await storage.getFeedbackByMessage(req.params.messageId);
    res.json(feedback);
  });

  // Send message and get AI response (with streaming - Multi-Agent System)
  app.post("/api/conversations/:id/messages", async (req, res) => {
    const { content } = req.body;
    const conversationId = req.params.id;

    // Save user message
    const userMessage = await storage.createMessage({
      conversationId,
      role: "user",
      content,
      aiProvider: null,
      model: null,
    });

    // Intelligent agent routing
    const { agentRole, taskType, reasoning } = analyzeAndRoute(content);
    const selectedAgent = AGENTS[agentRole];

    // Get conversation history for context
    const messages = await storage.getMessages(conversationId);
    const chatMessages = messages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Stream response from selected agent
      const stream = await generateAgentResponse(agentRole, chatMessages, true);

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ 
            content, 
            provider: 'openai',
            model: selectedAgent.model,
            agentRole: selectedAgent.role,
            agentName: selectedAgent.name,
            taskType
          })}\n\n`);
        }
      }

      // Save assistant message with agent metadata
      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        aiProvider: 'openai',
        model: selectedAgent.model,
        agentRole: selectedAgent.role,
        taskType,
      });

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error('AI Error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  });

  // ============ ADMIN ROUTES ============
  
  // Admin: Get platform analytics
  app.get("/api/admin/analytics", isAdmin, async (_req, res) => {
    try {
      const conversations = await storage.getConversations();
      const feedback = await db.select().from(userFeedback);
      const allUsers = await db.select().from(users);
      
      res.json({
        totalConversations: conversations.length,
        totalUsers: allUsers.length,
        totalFeedback: feedback.length,
        adminCount: allUsers.filter((u: any) => u.isAdmin).length,
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin: AI Assistant endpoint (private AI for admin)
  app.post("/api/admin/assistant", isAdmin, async (req, res) => {
    const { message } = req.body;
    
    try {
      // This is the admin's private AI assistant
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an admin assistant for an AI Learning Platform. Help the admin manage the platform, analyze data, moderate content, and make decisions. Provide insights and recommendations."
          },
          {
            role: "user",
            content: message
          }
        ],
        stream: false,
      });

      res.json({ response: completion.choices[0].message.content });
    } catch (error: any) {
      console.error("Admin AI error:", error);
      res.status(500).json({ message: "AI assistant error" });
    }
  });

  // Admin: Toggle user admin status
  app.post("/api/admin/users/:id/toggle-admin", isAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await storage.upsertUser({
        ...user,
        isAdmin: !user.isAdmin,
      });

      res.json(updated);
    } catch (error) {
      console.error("Toggle admin error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  return server;
}
