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
  insertCompanySchema,
  insertContactSchema,
  insertProjectSchema,
  insertCommunicationSchema,
  insertResearchSchema,
  userFeedback, 
  users 
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import OpenAI from "openai";
import { analyzeAndRoute, generateAgentResponse, AGENTS, executeFunction, extractAndSaveMemories } from "./agentCoordinator";
import { cache } from "./cache";

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

    // Get user ID for memory and agent context
    const userId = (req.user as any)?.id || 'default_user';
    
    try {
      // Task Manager always uses non-streaming to support function calling
      if (agentRole === 'task_manager') {
        const response = await generateAgentResponse(agentRole, chatMessages, false, userId);
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
            
            // Execute the function with conversation context
            const result = await executeFunction(functionName, functionArgs, conversationId, agentRole);
            
            // Get confirmation message from AI
            const confirmationMessages = [
              ...chatMessages,
              { role: "assistant" as const, content: choice.message.content || "", tool_calls: choice.message.tool_calls },
              { role: "tool" as const, content: JSON.stringify(result), tool_call_id: toolCall.id }
            ];
            
            const confirmationResponse = await generateAgentResponse(agentRole, confirmationMessages as any, false, userId);
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
        
        // Extract and save memories from this conversation turn (with comprehensive logging)
        console.log(`🚀 Starting memory extraction - userId: ${userId}, conversationId: ${conversationId}`);
        extractAndSaveMemories(userId, conversationId, content, fullResponse, agentRole)
          .then(() => {
            console.log('✅ Memory extraction completed successfully');
          })
          .catch(err => {
            console.error('❌ Background memory extraction failed:', err);
            console.error('Error stack:', err.stack);
          });
        
        res.write(`data: [DONE]\n\n`);
        res.end();
      } else {
        // Normal streaming for other agents
        const stream = await generateAgentResponse(agentRole, chatMessages, true, userId);

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

        // Extract and save memories from this conversation turn (with comprehensive logging)
        console.log(`🚀 Starting memory extraction - userId: ${userId}, conversationId: ${conversationId}`);
        extractAndSaveMemories(userId, conversationId, content, fullResponse, agentRole)
          .then(() => {
            console.log('✅ Memory extraction completed successfully');
          })
          .catch(err => {
            console.error('❌ Background memory extraction failed:', err);
            console.error('Error stack:', err.stack);
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

  // ============ ORCHESTRATION ROUTES ============
  
  // Orchestrate - Master Orchestrator analyzes request and coordinates agents
  app.post("/api/orchestrate", async (req, res) => {
    const { message, userId = 'default_user', userTier = 'free' } = req.body;
    
    try {
      // Create a conversation for this orchestration session
      const conversation = await storage.createConversation({
        title: `Orchestration: ${message.slice(0, 50)}${message.length > 50 ? '...' : ''}`
      });
      
      // Import orchestrator (dynamic to avoid circular deps)
      const { orchestrate } = await import('./masterOrchestrator');
      
      // Execute orchestration with real conversation ID
      const result = await orchestrate(message, conversation.id, userId, userTier);
      
      res.json(result);
    } catch (error: any) {
      console.error('Orchestration error:', error);
      
      // Return 422 for validation errors, 500 for other errors
      const statusCode = error.isValidationError ? 422 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message,
        type: error.isValidationError ? 'validation_error' : 'server_error'
      });
    }
  });

  // Orchestrate Stream - Real-time SSE streaming of orchestration progress
  app.post("/api/orchestrate/stream", async (req, res) => {
    const { message, userId = 'default_user', userTier = 'free' } = req.body;
    
    try {
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      
      // Create conversation
      const conversation = await storage.createConversation({
        title: `Orchestration: ${message.slice(0, 50)}${message.length > 50 ? '...' : ''}`
      });
      
      // Send initial event
      res.write(`data: ${JSON.stringify({ type: 'start', conversationId: conversation.id })}\n\n`);
      
      // Import orchestrator
      const { orchestrateStreaming } = await import('./masterOrchestrator');
      
      // Execute with streaming callback
      await orchestrateStreaming(message, conversation.id, userId, userTier, (event: any) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });
      
      // Send completion
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Streaming orchestration error:', error);
      
      // Send appropriate error type via SSE
      const errorType = error.isValidationError ? 'validation_error' : 'server_error';
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        errorType,
        error: error.message 
      })}\n\n`);
      res.end();
    }
  });

  // ============ CRM ROUTES - RelationTrack Features ============
  
  // Companies
  app.get("/api/companies", async (_req, res) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  app.get("/api/companies/:id", async (req, res) => {
    const company = await storage.getCompany(req.params.id);
    res.json(company);
  });

  app.post("/api/companies", async (req, res) => {
    const data = insertCompanySchema.parse(req.body);
    const company = await storage.createCompany(data);
    res.json(company);
  });

  app.patch("/api/companies/:id", async (req, res) => {
    const company = await storage.updateCompany(req.params.id, req.body);
    res.json(company);
  });

  app.delete("/api/companies/:id", async (req, res) => {
    await storage.deleteCompany(req.params.id);
    res.json({ success: true });
  });

  // Contacts
  app.get("/api/contacts", async (_req, res) => {
    const contacts = await storage.getContacts();
    res.json(contacts);
  });

  app.get("/api/contacts/:id", async (req, res) => {
    const contact = await storage.getContact(req.params.id);
    res.json(contact);
  });

  app.get("/api/contacts/company/:companyId", async (req, res) => {
    const contacts = await storage.getContactsByCompany(req.params.companyId);
    res.json(contacts);
  });

  app.post("/api/contacts", async (req, res) => {
    const data = insertContactSchema.parse(req.body);
    const contact = await storage.createContact(data);
    res.json(contact);
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    const contact = await storage.updateContact(req.params.id, req.body);
    res.json(contact);
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    await storage.deleteContact(req.params.id);
    res.json({ success: true });
  });

  // Projects
  app.get("/api/projects", async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(req.params.id);
    res.json(project);
  });

  app.get("/api/projects/contact/:contactId", async (req, res) => {
    const projects = await storage.getProjectsByContact(req.params.contactId);
    res.json(projects);
  });

  app.get("/api/projects/company/:companyId", async (req, res) => {
    const projects = await storage.getProjectsByCompany(req.params.companyId);
    res.json(projects);
  });

  app.post("/api/projects", async (req, res) => {
    const data = insertProjectSchema.parse(req.body);
    const project = await storage.createProject(data);
    res.json(project);
  });

  app.patch("/api/projects/:id", async (req, res) => {
    const project = await storage.updateProject(req.params.id, req.body);
    res.json(project);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.json({ success: true });
  });

  // Communications
  app.get("/api/communications", async (_req, res) => {
    const communications = await storage.getCommunications();
    res.json(communications);
  });

  app.get("/api/communications/:id", async (req, res) => {
    const communication = await storage.getCommunication(req.params.id);
    res.json(communication);
  });

  app.get("/api/communications/contact/:contactId", async (req, res) => {
    const communications = await storage.getCommunicationsByContact(req.params.contactId);
    res.json(communications);
  });

  app.get("/api/communications/project/:projectId", async (req, res) => {
    const communications = await storage.getCommunicationsByProject(req.params.projectId);
    res.json(communications);
  });

  app.post("/api/communications", async (req, res) => {
    const data = insertCommunicationSchema.parse(req.body);
    const communication = await storage.createCommunication(data);
    res.json(communication);
  });

  app.patch("/api/communications/:id", async (req, res) => {
    const communication = await storage.updateCommunication(req.params.id, req.body);
    res.json(communication);
  });

  app.delete("/api/communications/:id", async (req, res) => {
    await storage.deleteCommunication(req.params.id);
    res.json({ success: true });
  });

  // Research
  app.get("/api/research", async (_req, res) => {
    const research = await storage.getResearch();
    res.json(research);
  });

  app.get("/api/research/:id", async (req, res) => {
    const researchItem = await storage.getResearchItem(req.params.id);
    res.json(researchItem);
  });

  app.get("/api/research/contact/:contactId", async (req, res) => {
    const research = await storage.getResearchByContact(req.params.contactId);
    res.json(research);
  });

  app.get("/api/research/company/:companyId", async (req, res) => {
    const research = await storage.getResearchByCompany(req.params.companyId);
    res.json(research);
  });

  app.get("/api/research/project/:projectId", async (req, res) => {
    const research = await storage.getResearchByProject(req.params.projectId);
    res.json(research);
  });

  app.post("/api/research", async (req, res) => {
    const data = insertResearchSchema.parse(req.body);
    const researchItem = await storage.createResearch(data);
    res.json(researchItem);
  });

  app.patch("/api/research/:id", async (req, res) => {
    const researchItem = await storage.updateResearch(req.params.id, req.body);
    res.json(researchItem);
  });

  app.delete("/api/research/:id", async (req, res) => {
    await storage.deleteResearch(req.params.id);
    res.json({ success: true });
  });

  // ============ ADMIN ROUTES ============
  
  // Admin: Get platform analytics
  app.get("/api/admin/analytics", isAdmin, async (_req, res) => {
    try {
      const conversations = await storage.getConversations();
      const feedback = await db.select().from(userFeedback);
      const allUsers = await db.select().from(users);
      const agentInteractions = await storage.getAgentInteractions();
      const analyticsEvents = await storage.getAnalyticsEvents({ limit: 1000 });
      const dailyMetrics = await storage.getDailyMetrics(30);
      
      // Calculate agent usage stats
      const agentUsageMap = new Map<string, number>();
      agentInteractions.forEach(interaction => {
        const count = agentUsageMap.get(interaction.primaryAgent) || 0;
        agentUsageMap.set(interaction.primaryAgent, count + 1);
      });
      
      const agentUsage = Array.from(agentUsageMap.entries()).map(([agentId, count]) => ({
        agentId,
        count
      })).sort((a, b) => b.count - a.count);
      
      // Calculate tool usage stats
      const toolUsageMap = new Map<string, number>();
      analyticsEvents
        .filter(e => e.toolName)
        .forEach(event => {
          const count = toolUsageMap.get(event.toolName!) || 0;
          toolUsageMap.set(event.toolName!, count + 1);
        });
      
      const toolUsage = Array.from(toolUsageMap.entries()).map(([toolName, count]) => ({
        toolName,
        count
      })).sort((a, b) => b.count - a.count);
      
      // Calculate performance metrics
      const executionTimes = analyticsEvents
        .filter(e => e.executionTimeMs)
        .map(e => e.executionTimeMs!);
      
      const avgExecutionTime = executionTimes.length > 0
        ? Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length)
        : 0;
      
      // Calculate success rate
      const successfulEvents = analyticsEvents.filter(e => e.success).length;
      const successRate = analyticsEvents.length > 0
        ? Math.round((successfulEvents / analyticsEvents.length) * 100)
        : 100;
      
      // Calculate cost metrics
      const totalCost = analyticsEvents
        .filter(e => e.estimatedCost)
        .reduce((sum, e) => sum + parseFloat(e.estimatedCost || '0'), 0);
      
      res.json({
        // Basic stats
        totalConversations: conversations.length,
        totalUsers: allUsers.length,
        totalFeedback: feedback.length,
        adminCount: allUsers.filter((u: any) => u.isAdmin).length,
        
        // Agent analytics
        agentUsage,
        totalAgentInteractions: agentInteractions.length,
        
        // Tool analytics
        toolUsage,
        totalToolExecutions: toolUsageMap.size > 0 ? Array.from(toolUsageMap.values()).reduce((a, b) => a + b, 0) : 0,
        
        // Performance metrics
        avgExecutionTime,
        successRate,
        
        // Cost metrics
        totalCost: totalCost.toFixed(4),
        
        // Time series data
        dailyMetrics: dailyMetrics.map(m => ({
          date: m.date,
          conversations: m.totalConversations,
          messages: m.totalMessages,
          orchestrations: m.totalOrchestrations,
          toolExecutions: m.totalToolExecutions,
          avgResponseTime: m.avgResponseTimeMs,
          cost: m.totalCost,
        })),
        
        // Recent events
        recentEvents: analyticsEvents.slice(0, 50).map(e => ({
          id: e.id,
          type: e.eventType,
          agent: e.agentId,
          tool: e.toolName,
          executionTime: e.executionTimeMs,
          success: e.success,
          timestamp: e.createdAt,
        })),
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin: Get cache performance metrics
  app.get("/api/admin/cache-metrics", isAdmin, async (_req, res) => {
    try {
      const metrics = cache.getMetrics();
      const stats = cache.getStats();
      
      res.json({
        metrics: {
          ...metrics,
          hitRatioFormatted: `${metrics.hitRatio.toFixed(2)}%`
        },
        stats,
        recommendations: []
      });
    } catch (error) {
      console.error("Cache metrics error:", error);
      res.status(500).json({ message: "Failed to fetch cache metrics" });
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
