import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertUserSettingsSchema, insertUserFeedbackSchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// AI Router: Determines best AI for each question type
function selectAIProvider(question: string): { provider: string; model: string } {
  const lowerQ = question.toLowerCase();
  
  // Code-related questions -> GPT-4
  if (lowerQ.includes('code') || lowerQ.includes('programming') || lowerQ.includes('debug') || lowerQ.includes('function')) {
    return { provider: 'openai', model: 'gpt-4o' };
  }
  
  // Creative/writing -> GPT-4o-mini (faster, cheaper)
  if (lowerQ.includes('write') || lowerQ.includes('create') || lowerQ.includes('story') || lowerQ.includes('poem')) {
    return { provider: 'openai', model: 'gpt-4o-mini' };
  }
  
  // Analysis/reasoning -> O3-mini (optimized for reasoning)
  if (lowerQ.includes('analyze') || lowerQ.includes('compare') || lowerQ.includes('explain') || lowerQ.includes('why')) {
    return { provider: 'openai', model: 'o3-mini' };
  }
  
  // Default to GPT-4o-mini for general questions
  return { provider: 'openai', model: 'gpt-4o-mini' };
}

export function registerRoutes(app: Express) {
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

  // Send message and get AI response (with streaming)
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

    // Select best AI provider based on question
    const { provider, model } = selectAIProvider(content);

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
      // Stream response from selected AI
      const stream = await openai.chat.completions.create({
        model,
        messages: chatMessages,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content, provider, model })}\n\n`);
        }
      }

      // Save assistant message
      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        aiProvider: provider,
        model,
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

  return server;
}
