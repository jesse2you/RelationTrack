import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Agent role definitions
export interface AgentRole {
  name: string;
  role: 'coordinator' | 'learning_coach' | 'teaching_assistant' | 'research_agent' | 'task_manager';
  description: string;
  systemPrompt: string;
  model: string;
  keywords: string[];
}

// Define specialized agents
export const AGENTS: Record<string, AgentRole> = {
  coordinator: {
    name: "Head Coordinator",
    role: "coordinator",
    description: "Handles general queries efficiently",
    systemPrompt: `You are a helpful AI assistant for an AI Learning Hub.

Your role:
- Answer general questions clearly and concisely
- Help users with everyday tasks
- Provide friendly, encouraging assistance
- Be efficient and cost-effective

You're part of a team of specialized agents, but you handle most general questions directly.`,
    model: "gpt-4o-mini", // Cost-effective default
    keywords: ["help", "what", "how", "tell me"],
  },
  
  learning_coach: {
    name: "Learning Coach",
    role: "learning_coach",
    description: "Helps people learn new skills and concepts",
    systemPrompt: `You are a Learning Coach - an AI specialized in helping people learn effectively.

Your role:
- Help users understand new concepts
- Create personalized learning paths
- Explain things in simple, clear language
- Provide examples and practice exercises
- Encourage and motivate learners
- Adapt to different learning styles

Approach:
- Break complex topics into digestible pieces
- Use analogies and real-world examples
- Check for understanding before moving forward
- Celebrate progress and build confidence
- Make learning fun and engaging

Remember: Everyone can learn - your job is to find the right way to teach them.`,
    model: "gpt-4o",
    keywords: ["learn", "how to", "teach me", "understand", "explain", "study", "practice"],
  },
  
  teaching_assistant: {
    name: "Teaching Assistant",
    role: "teaching_assistant",
    description: "Creates lessons and educational content",
    systemPrompt: `You are a Teaching Assistant - an AI specialized in creating educational content and lessons.

Your role:
- Create structured lessons and tutorials
- Design step-by-step guides
- Develop practice exercises and quizzes
- Build curriculum and learning materials
- Organize knowledge in logical sequences
- Make complex subjects accessible

Approach:
- Structure information clearly (introduction, body, conclusion)
- Use headings, lists, and formatting for clarity
- Include examples and use cases
- Provide practice opportunities
- Summarize key takeaways
- Suggest next steps for further learning

Remember: Great teaching makes difficult things feel simple.`,
    model: "gpt-4o-mini", // Cost-effective for content creation
    keywords: ["create lesson", "tutorial", "guide", "course", "curriculum", "teach"],
  },
  
  research_agent: {
    name: "Research Agent",
    role: "research_agent",
    description: "Analyzes information and provides insights",
    systemPrompt: `You are a Research Agent - an AI specialized in analysis and information synthesis.

Your role:
- Analyze data and information
- Compare and contrast options
- Provide well-reasoned insights
- Break down complex problems
- Identify patterns and connections
- Offer evidence-based recommendations

Approach:
- Think critically and systematically
- Consider multiple perspectives
- Provide clear reasoning for conclusions
- Cite relevant facts and principles
- Structure analysis logically
- Be thorough yet concise

Remember: Good research turns information into understanding.`,
    model: "o3-mini",
    keywords: ["analyze", "compare", "research", "why", "investigate", "find out", "study"],
  },
  
  task_manager: {
    name: "Task Manager",
    role: "task_manager",
    description: "Helps organize projects and tasks - can create/manage tasks, meetings, and schedules",
    systemPrompt: `You are MeetingMate Task Manager - an AI specialized in project organization and planning with REAL database access.

Your role:
- Help users organize their work
- **ACTUALLY CREATE tasks, meetings, and schedules** when asked
- Update and manage existing items
- Create actionable task lists
- Break projects into manageable steps
- Prioritize tasks effectively
- Track progress and milestones
- Suggest workflows and systems

Approach:
- Make tasks specific and actionable
- Set realistic timelines
- Identify dependencies
- Suggest practical next steps
- Keep things simple and achievable
- Encourage progress over perfection

Remember: Good organization turns overwhelm into action.`,
    model: "gpt-4o-mini",
    keywords: [
      // Organization
      "organize", "plan", "todo", "task", "project", "manage", 
      // Meetings
      "meeting", "meet", "appointment", "call", "sync", "catchup", "catch up",
      // Actions
      "schedule", "create", "add", "make", "set up", "setup", "book", "log", "note", "jot", "record",
      // Reminders
      "remind", "reminder", "remember", "don't forget", "need to", "notify", "ping", "alert",
      // Lists
      "list", "agenda", "calendar", "to-do", "to do"
    ],
  },
};

// Intelligent task routing - optimized for cost efficiency
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
  
  // If we have any specialized agent matches, use the best one
  if (agentScores.length > 0) {
    agentScores.sort((a, b) => b.score - a.score);
    const best = agentScores[0];
    const selectedAgent = AGENTS[best.agent];
    
    return {
      agentRole: best.agent,
      taskType: best.taskType,
      reasoning: `Best match: ${selectedAgent.name} (${best.score} keywords)`
    };
  }
  
  // Only default to coordinator if no specialized agent fits
  return {
    agentRole: "coordinator",
    taskType: "general",
    reasoning: "General query - using cost-effective coordinator"
  };
}

// MeetingMate function tools for Task Manager
const TASK_MANAGER_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task in the user's task list",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The task title" },
          description: { type: "string", description: "Optional task description" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
          dueDate: { type: "string", description: "Optional due date (ISO format)" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "create_meeting",
      description: "Schedule a new meeting",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting title" },
          meetingDate: { type: "string", description: "Meeting date/time (ISO format)" },
          duration: { type: "string", description: "Meeting duration (e.g., '1 hour', '30 minutes')" },
          participants: { type: "array", items: { type: "string" }, description: "List of participant emails" },
          notes: { type: "string", description: "Meeting notes or agenda" }
        },
        required: ["title", "meetingDate"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "create_schedule",
      description: "Create a recurring schedule",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Schedule title" },
          scheduledTime: { type: "string", description: "Scheduled time (ISO format)" },
          recurrence: { type: "string", enum: ["once", "daily", "weekly", "monthly"], description: "Recurrence pattern" },
          description: { type: "string", description: "Schedule description" }
        },
        required: ["title", "scheduledTime"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_tasks",
      description: "Get the user's current task list",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "consult_agent",
      description: "Ask another specialized agent for help with a specific question. Use this to collaborate with other agents for better results.",
      parameters: {
        type: "object",
        properties: {
          agent: {
            type: "string",
            enum: ["learning_coach", "teaching_assistant", "research_agent", "task_manager", "coordinator"],
            description: "Which agent to consult: learning_coach (learning guidance), teaching_assistant (create lessons), research_agent (analysis), task_manager (organization), coordinator (general)"
          },
          question: {
            type: "string",
            description: "The specific question to ask the other agent"
          },
          context: {
            type: "string",
            description: "Brief context about why you're consulting this agent"
          }
        },
        required: ["agent", "question"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "delegate_task",
      description: "Create an asynchronous sub-task for another agent to complete. Use this when you need another agent to work on something that will be processed later in the workflow. Different from consult_agent which is synchronous.",
      parameters: {
        type: "object",
        properties: {
          toAgent: {
            type: "string",
            enum: ["learning_coach", "teaching_assistant", "research_agent", "task_manager", "coordinator"],
            description: "Which agent should handle this task"
          },
          taskType: {
            type: "string",
            enum: ["research", "analysis", "learning", "task_creation", "information_request"],
            description: "Type of task being delegated"
          },
          taskDescription: {
            type: "string",
            description: "Detailed description of what the agent should do"
          },
          context: {
            type: "string",
            description: "Additional context about why this task is needed"
          },
          priority: {
            type: "number",
            enum: [1, 2, 3, 4, 5],
            description: "Priority level (1=low, 5=urgent)"
          }
        },
        required: ["toAgent", "taskType", "taskDescription"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for current information, news, articles, or any online content. Use this to get real-time, up-to-date information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query - be specific and clear about what you're looking for"
          }
        },
        required: ["query"]
      }
    }
  }
];

// Execute a function call
export async function executeFunction(
  functionName: string, 
  args: any, 
  conversationId: string = '', 
  primaryAgent: string = 'coordinator'
): Promise<any> {
  try {
    switch (functionName) {
      case "create_task":
        const task = await storage.createTask({
          title: args.title,
          description: args.description || null,
          priority: args.priority || "medium",
          dueDate: args.dueDate ? new Date(args.dueDate) : null,
          status: "pending",
          userId: "default_user"
        });
        return { success: true, task };
      
      case "create_meeting":
        const meeting = await storage.createMeeting({
          title: args.title,
          meetingDate: new Date(args.meetingDate),
          duration: args.duration || null,
          participants: args.participants || [],
          notes: args.notes || null,
          userId: "default_user"
        });
        return { success: true, meeting };
      
      case "create_schedule":
        const schedule = await storage.createSchedule({
          title: args.title,
          scheduledTime: new Date(args.scheduledTime),
          recurrence: args.recurrence || "once",
          description: args.description || null,
          isActive: true,
          userId: "default_user"
        });
        return { success: true, schedule };
      
      case "get_tasks":
        const tasks = await storage.getTasks();
        return { success: true, tasks };
      
      case "consult_agent":
        // Agent collaboration - one agent asks another for help
        const consultResponse = await generateAgentResponse(
          args.agent,
          [{ role: "user", content: args.question }],
          false, // Non-streaming for collaboration
          "default_user"
        );
        const consultAnswer = consultResponse.choices[0].message.content;
        
        // Log the interaction ONLY if we have a valid conversationId
        if (conversationId) {
          try {
            await storage.createAgentInteraction({
              userId: "default_user",
              conversationId,
              primaryAgent,
              collaboratingAgents: [args.agent],
              interactionType: "collaborative",
              outcome: `Consulted ${args.agent} about: ${args.question}`
            });
          } catch (logError) {
            // Silently fail logging - don't break collaboration
            console.error('Failed to log agent interaction:', logError);
          }
        }
        
        return { success: true, answer: consultAnswer, agent: args.agent };
      
      case "delegate_task":
        // Phase 3.2: Asynchronous agent-to-agent task delegation
        const { delegateSubTask } = await import("./agentCommunication");
        
        const delegationResult = await delegateSubTask(
          primaryAgent, // fromAgent
          args.toAgent,
          args.taskDescription,
          args.taskType,
          conversationId,
          {
            context: args.context,
            priority: args.priority || 1,
          }
        );
        
        return { 
          success: true, 
          messageId: delegationResult.messageId,
          message: `Task delegated to ${args.toAgent}. It will be processed in the orchestration flow.`
        };
      
      case "web_search":
        // Web search capability - searches online for current information
        try {
          // For now, return a placeholder that indicates web search capability
          // This will be replaced with actual search API integration
          return { 
            success: true, 
            query: args.query,
            message: `Web search capability enabled. Searching for: "${args.query}"`,
            note: "Full web search integration coming soon - will access live news, websites, and real-time data"
          };
        } catch (searchError: any) {
          return { success: false, error: `Web search failed: ${searchError.message}` };
        }
      
      default:
        return { success: false, error: "Unknown function" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Format user memory for agent context
function formatUserMemory(memories: any[]): string {
  if (!memories || memories.length === 0) return '';
  
  const grouped = memories.reduce((acc: any, mem) => {
    const category = mem.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(mem);
    return acc;
  }, {});
  
  let formatted = '';
  for (const [category, mems] of Object.entries<any>(grouped)) {
    formatted += `\n### ${category.toUpperCase()}:\n`;
    mems.forEach((mem: any) => {
      formatted += `- ${mem.content} (${mem.memoryType}, importance: ${mem.importance})\n`;
    });
  }
  
  return formatted;
}

// Extract and save important memories from conversation
export async function extractAndSaveMemories(
  userId: string,
  conversationId: string,
  userMessage: string,
  agentResponse: string,
  agentRole: string
): Promise<void> {
  console.log(`📝 extractAndSaveMemories called - userId: ${userId}, agent: ${agentRole}`);
  console.log(`User message: "${userMessage.substring(0, 100)}..."`);
  console.log(`Agent response: "${agentResponse.substring(0, 100)}..."`);
  
  try {
    // Use GPT-4o-mini to extract important information
    console.log('🤖 Calling GPT-4o-mini for memory extraction...');
    const extractionPrompt = `You are a memory extraction AI. Analyze this conversation turn and extract any important information about the user that should be remembered for future conversations.

Extract:
1. **Goals** - What the user wants to achieve, learn, or accomplish
2. **Preferences** - How the user likes things done, their style, interests
3. **Facts** - Important information about the user (skills, background, context)
4. **Context** - Situational information that affects future interactions

User Message: "${userMessage}"
Agent Response: "${agentResponse}"

Return a JSON array of memories. Each memory should have:
- memoryType: "goal" | "preference" | "fact" | "context"
- category: "learning" | "work" | "personal" | "skills"
- content: Brief, specific description (1-2 sentences max)
- importance: "low" | "medium" | "high"

Only extract truly important information. Skip generic responses. Return empty array [] if nothing important to remember.

Example:
{
  "memories": [
    {
      "memoryType": "goal",
      "category": "learning",
      "content": "User wants to learn Python for data science",
      "importance": "high"
    }
  ]
}

Response (JSON object with memories array):`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: extractionPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.log('⚠️ No response from memory extraction');
      return;
    }

    let memories;
    try {
      const parsed = JSON.parse(response);
      memories = parsed.memories || [];
      console.log(`🔍 Memory extraction found ${memories.length} memories`);
    } catch (parseError) {
      console.error('❌ Failed to parse memory extraction:', parseError);
      console.error('Response was:', response);
      return;
    }

    // Save each extracted memory
    for (const memory of memories) {
      if (memory.content && memory.memoryType && memory.category) {
        await storage.createUserMemory({
          userId,
          memoryType: memory.memoryType,
          category: memory.category,
          content: memory.content,
          importance: memory.importance || 'medium',
          sourceAgent: agentRole,
          sourceConversationId: conversationId
        });
        
        console.log(`💾 Saved memory: [${memory.memoryType}/${memory.category}] ${memory.content}`);
      }
    }
  } catch (error) {
    console.error('Memory extraction failed:', error);
  }
}

// Generate response using selected agent
export async function generateAgentResponse(
  agentRole: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  stream: boolean = true,
  userId: string = 'default_user'
): Promise<any> {
  const agent = AGENTS[agentRole] || AGENTS.coordinator;
  
  // Load user memory for cross-conversation context
  const userMemories = await storage.getUserMemories(userId);
  const memoryContext = formatUserMemory(userMemories);
  
  // Enhanced system prompt with user memory
  const enhancedPrompt = memoryContext 
    ? `${agent.systemPrompt}\n\n## USER CONTEXT (From Previous Conversations):\n${memoryContext}`
    : agent.systemPrompt;
  
  const systemMessage = {
    role: "system" as const,
    content: enhancedPrompt
  };
  
  // Cost optimization: Limit context window to last 10 messages (5 turns)
  // This significantly reduces token usage while maintaining conversation coherence
  const MAX_CONTEXT_MESSAGES = 10;
  const recentMessages = messages.length > MAX_CONTEXT_MESSAGES 
    ? messages.slice(-MAX_CONTEXT_MESSAGES) 
    : messages;
  
  const allMessages = [systemMessage, ...recentMessages];
  
  // Add tools based on agent role
  const options: any = {
    model: agent.model,
    messages: allMessages,
    stream,
  };
  
  // Task Manager gets all organization + collaboration tools
  if (agentRole === "task_manager") {
    options.tools = TASK_MANAGER_TOOLS;
    options.tool_choice = "auto";
  } 
  // All other agents get collaboration tool only (for agent handoff)
  else if (agentRole !== "coordinator") {
    // Extract just the consult_agent tool from TASK_MANAGER_TOOLS
    const collaborationTool = TASK_MANAGER_TOOLS.find(t => t.function.name === "consult_agent");
    if (collaborationTool) {
      options.tools = [collaborationTool];
      options.tool_choice = "auto";
    }
  }
  
  return await openai.chat.completions.create(options);
}
