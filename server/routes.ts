import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "../db";
import { 
  insertConversationSchema, 
  insertMessageSchema, 
  insertUserSettingsSchema, 
  insertUserFeedbackSchema, 
  insertTaskSchema,
  insertMeetingSchema,
  insertScheduleSchema,
  userFeedback, 
  users 
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import OpenAI from "openai";
import { analyzeAndRoute, generateAgentResponse, AGENTS, executeFunction } from "./agentCoordinator";

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

  // MeetingMate Organization Routes
  // Tasks
  app.get("/api/tasks", async (_req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get("/api/tasks/:id", async (req, res) => {
    const task = await storage.getTask(req.params.id);
    res.json(task);
  });

  app.post("/api/tasks", async (req, res) => {
    const data = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(data);
    res.json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    await storage.deleteTask(req.params.id);
    res.json({ success: true });
  });

  // Meetings
  app.get("/api/meetings", async (_req, res) => {
    const meetings = await storage.getMeetings();
    res.json(meetings);
  });

  app.get("/api/meetings/:id", async (req, res) => {
    const meeting = await storage.getMeeting(req.params.id);
    res.json(meeting);
  });

  app.post("/api/meetings", async (req, res) => {
    const data = insertMeetingSchema.parse(req.body);
    const meeting = await storage.createMeeting(data);
    res.json(meeting);
  });

  app.patch("/api/meetings/:id", async (req, res) => {
    const meeting = await storage.updateMeeting(req.params.id, req.body);
    res.json(meeting);
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    await storage.deleteMeeting(req.params.id);
    res.json({ success: true });
  });

  // Schedules
  app.get("/api/schedules", async (_req, res) => {
    const schedules = await storage.getSchedules();
    res.json(schedules);
  });

  app.get("/api/schedules/:id", async (req, res) => {
    const schedule = await storage.getSchedule(req.params.id);
    res.json(schedule);
  });

  app.post("/api/schedules", async (req, res) => {
    const data = insertScheduleSchema.parse(req.body);
    const schedule = await storage.createSchedule(data);
    res.json(schedule);
  });

  app.patch("/api/schedules/:id", async (req, res) => {
    const schedule = await storage.updateSchedule(req.params.id, req.body);
    res.json(schedule);
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    await storage.deleteSchedule(req.params.id);
    res.json({ success: true });
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
      // Task Manager always uses non-streaming to support function calling
      if (agentRole === 'task_manager') {
        const response = await generateAgentResponse(agentRole, chatMessages, false);
        const choice = response.choices[0];
        
        let fullResponse = '';
        let functionExecuted = null;
        
        // Check if AI wants to call a function
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          const toolCall = choice.message.tool_calls[0];
          const functionName = toolCall.function.name;
          functionExecuted = functionName;
          
          try {
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            // Execute the function
            const result = await executeFunction(functionName, functionArgs);
            
            // Get confirmation message from AI
            const confirmationMessages = [
              ...chatMessages,
              { role: "assistant" as const, content: choice.message.content || "", tool_calls: choice.message.tool_calls },
              { role: "tool" as const, content: JSON.stringify(result), tool_call_id: toolCall.id }
            ];
            
            const confirmationResponse = await generateAgentResponse(agentRole, confirmationMessages as any, false);
            fullResponse = confirmationResponse.choices[0].message.content || '';
            
            if (!result.success) {
              fullResponse = `I encountered an error: ${result.error}. ${fullResponse}`;
            }
          } catch (funcError: any) {
            fullResponse = `I had trouble executing that action: ${funcError.message}. How else can I help?`;
          }
        } else {
          // No function call, just respond normally
          fullResponse = choice.message.content || '';
        }
        
        // Manually "stream" the response in chunks for consistent UX
        const words = fullResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          res.write(`data: ${JSON.stringify({ 
            content: chunk, 
            provider: 'openai',
            model: selectedAgent.model,
            agentRole: selectedAgent.role,
            agentName: selectedAgent.name,
            taskType,
            functionExecuted: i === 0 ? functionExecuted : undefined
          })}\n\n`);
        }
        
        // Save assistant message
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
      } else {
        // Normal streaming for other agents
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
      }
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
