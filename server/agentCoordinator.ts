import OpenAI from "openai";

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
    description: "Helps organize projects and tasks",
    systemPrompt: `You are a Task Manager - an AI specialized in project organization and planning.

Your role:
- Help users organize their work
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
    keywords: ["organize", "plan", "todo", "task", "project", "manage", "schedule"],
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

// Generate response using selected agent
export async function generateAgentResponse(
  agentRole: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  stream: boolean = true
): Promise<any> {
  const agent = AGENTS[agentRole] || AGENTS.coordinator;
  
  const systemMessage = {
    role: "system" as const,
    content: agent.systemPrompt
  };
  
  // Cost optimization: Limit context window to last 10 messages (5 turns)
  // This significantly reduces token usage while maintaining conversation coherence
  const MAX_CONTEXT_MESSAGES = 10;
  const recentMessages = messages.length > MAX_CONTEXT_MESSAGES 
    ? messages.slice(-MAX_CONTEXT_MESSAGES) 
    : messages;
  
  const allMessages = [systemMessage, ...recentMessages];
  
  return await openai.chat.completions.create({
    model: agent.model,
    messages: allMessages,
    stream,
  });
}
