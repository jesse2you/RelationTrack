# 💻 QWENTICINICIAL - CRITICAL CODE REFERENCE
**Key Code Snippets for Integration**

---

## 🤖 AGENT DEFINITIONS (Copy This Entire Block)

```typescript
// server/agentCoordinator.ts

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface AgentRole {
  name: string;
  role: 'coordinator' | 'learning_coach' | 'teaching_assistant' | 'research_agent' | 'task_manager';
  description: string;
  systemPrompt: string;
  model: string;
  keywords: string[];
}

export const AGENTS: Record<string, AgentRole> = {
  coordinator: {
    name: "Head Coordinator",
    role: "coordinator",
    description: "Handles general queries efficiently",
    systemPrompt: `You are a helpful AI assistant...`,
    model: "gpt-4o-mini",
    keywords: ["help", "what", "how", "tell me"],
  },
  
  learning_coach: {
    name: "Learning Coach",
    role: "learning_coach",
    description: "Helps people learn new skills and concepts",
    systemPrompt: `You are a Learning Coach - an AI specialized in helping people learn effectively...`,
    model: "gpt-4o",
    keywords: ["learn", "how to", "teach me", "understand", "explain", "study", "practice"],
  },
  
  teaching_assistant: {
    name: "Teaching Assistant",
    role: "teaching_assistant",
    description: "Creates lessons and educational content",
    systemPrompt: `You are a Teaching Assistant - an AI specialized in creating educational content...`,
    model: "gpt-4o-mini",
    keywords: ["create lesson", "tutorial", "guide", "course", "curriculum", "teach"],
  },
  
  research_agent: {
    name: "Research Agent",
    role: "research_agent",
    description: "Analyzes information and provides insights",
    systemPrompt: `You are a Research Agent - an AI specialized in analysis...`,
    model: "o3-mini",
    keywords: ["analyze", "compare", "research", "why", "investigate", "find out", "study"],
  },
  
  task_manager: {
    name: "Task Manager",
    role: "task_manager",
    description: "Helps organize projects and tasks",
    systemPrompt: `You are MeetingMate Task Manager with REAL database access...`,
    model: "gpt-4o-mini",
    keywords: ["organize", "plan", "todo", "task", "project", "manage", "meeting", "schedule", "create", "add", "remind"],
  },
};
```

---

## 🎯 AGENT ROUTING ALGORITHM

```typescript
// server/agentCoordinator.ts

export function analyzeAndRoute(userMessage: string): {
  agentRole: string;
  taskType: string;
  reasoning: string;
} {
  const lowerMessage = userMessage.toLowerCase();
  
  // Score each agent based on keyword matches
  const agentScores: Array<{agent: string, score: number, taskType: string}> = [];
  
  for (const [key, agent] of Object.entries(AGENTS)) {
    if (key === 'coordinator') continue; // Check coordinator last
    
    const matchCount = agent.keywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length;
    
    if (matchCount > 0) {
      let taskType = 'general';
      if (lowerMessage.includes('learn')) taskType = 'learning';
      if (lowerMessage.includes('teach') || lowerMessage.includes('lesson')) taskType = 'teaching';
      if (lowerMessage.includes('research') || lowerMessage.includes('analyze')) taskType = 'research';
      if (lowerMessage.includes('task') || lowerMessage.includes('plan') || lowerMessage.includes('organize')) taskType = 'planning';
      
      agentScores.push({
        agent: agent.role,
        score: matchCount,
        taskType
      });
    }
  }
  
  // Use the best matching specialized agent
  if (agentScores.length > 0) {
    agentScores.sort((a, b) => b.score - a.score);
    const best = agentScores[0];
    return {
      agentRole: best.agent,
      taskType: best.taskType,
      reasoning: `Best match: ${AGENTS[best.agent].name} (${best.score} keywords)`
    };
  }
  
  // Default to coordinator
  return {
    agentRole: "coordinator",
    taskType: "general",
    reasoning: "General query - using cost-effective coordinator"
  };
}
```

---

## 🧠 MASTER ORCHESTRATOR - CORE LOGIC

```typescript
// server/masterOrchestrator.ts

export interface ExecutionPlan {
  analysisId: string;
  primaryAgent: string;
  collaboratingAgents: string[];
  toolsNeeded: string[];
  executionSteps: ExecutionStep[];
  estimatedDuration: string;
}

export interface ExecutionStep {
  stepNumber: number;
  agent: string;
  action: string;
  toolsUsed: string[];
  dependsOn?: number[];
}

export async function analyzeAndPlan(
  userMessage: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<ExecutionPlan> {
  
  console.log('🧠 Master Orchestrator analyzing request...');
  
  const tierConfig = getUserTierConfig(userTier);
  const availableAgents = tierConfig.agentAccess;
  const availableTools = tierConfig.tools.map(t => t.name);
  
  const systemPrompt = `You are the Master Orchestrator for Qwenticinicial.

Available Agents:
${availableAgents.map(agentId => {
  const agent = AGENTS[agentId];
  return `- ${agent.name} (${agentId}): ${agent.description}`;
}).join('\n')}

Available Tools: ${availableTools.join(', ')}

Create a step-by-step execution plan as JSON:
{
  "primaryAgent": "agent_id",
  "collaboratingAgents": ["other_agents"],
  "toolsNeeded": ["tools"],
  "executionSteps": [
    {
      "stepNumber": 1,
      "agent": "agent_id",
      "action": "what to do",
      "toolsUsed": ["tools"],
      "dependsOn": []
    }
  ],
  "estimatedDuration": "estimate"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze: "${userMessage}"` }
    ],
    response_format: { type: "json_object" },
  });

  const planData = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    analysisId: `analysis_${Date.now()}`,
    primaryAgent: planData.primaryAgent || 'coordinator',
    collaboratingAgents: planData.collaboratingAgents || [],
    toolsNeeded: planData.toolsNeeded || [],
    executionSteps: planData.executionSteps || [],
    estimatedDuration: planData.estimatedDuration || 'unknown',
  };
}

export async function executePlan(
  plan: ExecutionPlan,
  userMessage: string,
  conversationId: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<OrchestrationResult> {
  
  console.log('🚀 Executing orchestration plan...');
  
  const results = [];
  
  // Execute steps sequentially
  for (const step of plan.executionSteps) {
    const agentConfig = AGENTS[step.agent];
    
    const agentResponse = await generateAgentResponse(
      step.agent,
      [{ role: "user", content: step.action }],
      false, // non-streaming
      userId
    );
    
    const output = agentResponse.choices[0].message.content || '';
    
    results.push({
      agent: agentConfig.name,
      output,
      toolsUsed: step.toolsUsed,
    });
  }
  
  // Compile final answer
  const compilationPrompt = `User's Question: "${userMessage}"

Agent Results:
${results.map((r, i) => `${i + 1}. ${r.agent}:\n${r.output}`).join('\n\n')}

Create a comprehensive final answer.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: compilationPrompt }],
  });

  return {
    success: true,
    plan,
    results,
    finalAnswer: finalResponse.choices[0].message.content || '',
  };
}

// Main entry point
export async function orchestrate(
  userMessage: string,
  conversationId: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<OrchestrationResult> {
  
  const plan = await analyzeAndPlan(userMessage, userId, userTier);
  const result = await executePlan(plan, userMessage, conversationId, userId, userTier);
  
  // Log interaction
  await storage.createAgentInteraction({
    userId,
    conversationId,
    primaryAgent: plan.primaryAgent,
    collaboratingAgents: plan.collaboratingAgents,
    interactionType: 'collaborative',
    outcome: `Orchestrated: ${plan.executionSteps.length} steps completed`
  });
  
  return result;
}
```

---

## 💾 DATABASE SCHEMA - ESSENTIAL TABLES

```typescript
// shared/schema.ts

import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  aiProvider: text("ai_provider"),
  model: text("model"),
  agentRole: text("agent_role"),
  taskType: text("task_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default('pending'),
  priority: text("priority").default('medium'),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  title: text("title").notNull(),
  notes: text("notes"),
  participants: text("participants").array(),
  meetingDate: timestamp("meeting_date").notNull(),
  duration: text("duration"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const userMemory = pgTable("user_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  memoryType: text("memory_type").notNull(),
  category: text("category"),
  content: text("content").notNull(),
  importance: text("importance").default('medium'),
  sourceAgent: text("source_agent"),
  sourceConversationId: varchar("source_conversation_id").references(() => conversations.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const agentInteractions = pgTable("agent_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  primaryAgent: text("primary_agent").notNull(),
  collaboratingAgents: text("collaborating_agents").array(),
  interactionType: text("interaction_type"),
  outcome: text("outcome"),
  memoryCreated: boolean("memory_created").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});
```

---

## 🌐 CRITICAL API ENDPOINTS

```typescript
// server/routes.ts

// Send message with multi-agent routing (SSE streaming)
app.post("/api/conversations/:id/messages", async (req, res) => {
  const { content } = req.body;
  const conversationId = req.params.id;
  const userId = (req.user as any)?.id || 'default_user';

  // Save user message
  await storage.createMessage({
    conversationId,
    role: "user",
    content,
    aiProvider: null,
    model: null,
  });

  // Intelligent agent routing
  const { agentRole, taskType } = analyzeAndRoute(content);
  const selectedAgent = AGENTS[agentRole];

  // Get conversation history
  const messages = await storage.getMessages(conversationId);
  const chatMessages = messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Stream AI response
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
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Master Orchestrator endpoint
app.post("/api/orchestrate", async (req, res) => {
  const { message, userId = 'default_user', userTier = 'free' } = req.body;
  
  try {
    // Create conversation
    const conversation = await storage.createConversation({
      title: `Orchestration: ${message.slice(0, 50)}...`
    });
    
    // Execute orchestration
    const { orchestrate } = await import('./masterOrchestrator');
    const result = await orchestrate(message, conversation.id, userId, userTier);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

---

## 🔧 TASK MANAGER TOOLS (Function Calling)

```typescript
// server/agentCoordinator.ts

const TASK_MANAGER_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          dueDate: { type: "string", description: "Due date (ISO format)" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "create_meeting",
      description: "Schedule a meeting",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting title" },
          meetingDate: { type: "string", description: "Date/time (ISO)" },
          duration: { type: "string", description: "e.g., '1 hour'" },
          participants: { type: "array", items: { type: "string" } },
          notes: { type: "string", description: "Meeting notes" }
        },
        required: ["title", "meetingDate"]
      }
    }
  }
];

// Execute function calls
export async function executeFunction(
  functionName: string,
  args: any,
  conversationId: string,
  agentRole: string
): Promise<any> {
  
  switch (functionName) {
    case 'create_task':
      return await storage.createTask({
        userId: 'default_user',
        title: args.title,
        description: args.description || '',
        priority: args.priority || 'medium',
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
      });
      
    case 'create_meeting':
      return await storage.createMeeting({
        userId: 'default_user',
        title: args.title,
        meetingDate: new Date(args.meetingDate),
        duration: args.duration || '30 minutes',
        participants: args.participants || [],
        notes: args.notes || '',
      });
      
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}
```

---

## 📊 TIER SYSTEM

```typescript
// server/tierConfig.ts

export const TIER_CONFIGS = {
  free: {
    displayName: "Free",
    agentAccess: ['coordinator', 'learning_coach', 'teaching_assistant', 'research_agent', 'task_manager'],
    tools: [
      { name: 'consult_agent', limit: 50 },
      { name: 'create_task', limit: 20 },
      { name: 'create_meeting', limit: 10 }
    ],
    messagesPerMonth: 100,
  },
  pro: {
    displayName: "Pro",
    agentAccess: ['coordinator', 'learning_coach', 'teaching_assistant', 'research_agent', 'task_manager'],
    tools: [
      { name: 'consult_agent', limit: 500 },
      { name: 'web_search', limit: 100 },
      { name: 'gmail_api', limit: 50 },
      { name: 'calendar_api', limit: 50 }
    ],
    messagesPerMonth: 1000,
  },
  premium: {
    displayName: "Premium",
    agentAccess: ['coordinator', 'learning_coach', 'teaching_assistant', 'research_agent', 'task_manager'],
    tools: [
      { name: 'consult_agent', limit: -1 }, // unlimited
      { name: 'web_search', limit: -1 },
      { name: 'notion_api', limit: -1 },
      { name: 'slack_api', limit: -1 },
      { name: 'video_creator', limit: 20 }
    ],
    messagesPerMonth: -1, // unlimited
  }
};

export function getUserTierConfig(tier: string) {
  return TIER_CONFIGS[tier] || TIER_CONFIGS.free;
}

export function hasToolAccess(userTier: string, toolName: string): boolean {
  const config = getUserTierConfig(userTier);
  return config.tools.some(t => t.name === toolName);
}
```

---

## 🔐 AUTHENTICATION MIDDLEWARE

```typescript
// server/replitAuth.ts

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}
```

---

## 🚀 QUICK INTEGRATION CHECKLIST

### 1. **Copy Agent Definitions**
- [ ] Copy `AGENTS` object from `agentCoordinator.ts`
- [ ] Copy `analyzeAndRoute()` function

### 2. **Copy Master Orchestrator**
- [ ] Copy `analyzeAndPlan()` function
- [ ] Copy `executePlan()` function
- [ ] Copy `orchestrate()` function

### 3. **Merge Database Schema**
- [ ] Copy all table definitions from `schema.ts`
- [ ] Run `npm run db:push --force`

### 4. **Add API Routes**
- [ ] Copy `/api/conversations/:id/messages` (SSE streaming)
- [ ] Copy `/api/orchestrate`
- [ ] Copy task/meeting/schedule CRUD routes

### 5. **Update Dependencies**
- [ ] Merge `package.json` dependencies
- [ ] Run `npm install`

### 6. **Environment Variables**
```bash
DATABASE_URL=<postgresql_url>
SESSION_SECRET=<secret>
AI_INTEGRATIONS_OPENAI_API_KEY=<key>
AI_INTEGRATIONS_OPENAI_BASE_URL=<url>
```

---

**✅ This reference contains all critical code needed for integration!**
