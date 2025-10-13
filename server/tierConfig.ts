// Tier-based Tool & Module Configuration
// Defines what tools and capabilities each tier can access

export interface ToolConfig {
  name: string;
  displayName: string;
  description: string;
  category: 'search' | 'productivity' | 'integration' | 'multimedia' | 'advanced';
  dailyLimit?: number; // undefined = unlimited
  monthlyLimit?: number;
}

export interface TierConfig {
  name: string;
  displayName: string;
  price: number; // Monthly price in USD
  description: string;
  tools: ToolConfig[];
  agentAccess: string[]; // Which agents are available
  messagesPerMonth: number; // 0 = unlimited
  features: string[];
}

// Tool Definitions
const TOOLS: Record<string, ToolConfig> = {
  // Search Tools
  web_search_basic: {
    name: 'web_search_basic',
    displayName: 'Web Search (Basic)',
    description: 'Search the web for information, news, and articles',
    category: 'search',
    dailyLimit: 10,
  },
  web_search_unlimited: {
    name: 'web_search_unlimited',
    displayName: 'Web Search (Unlimited)',
    description: 'Unlimited web searches for current information',
    category: 'search',
  },
  news_aggregation: {
    name: 'news_aggregation',
    displayName: 'News Aggregation',
    description: 'Get curated news from multiple sources',
    category: 'search',
  },
  
  // Productivity Tools
  task_management: {
    name: 'task_management',
    displayName: 'Task Management',
    description: 'Create and manage tasks, meetings, schedules',
    category: 'productivity',
  },
  calendar_basic: {
    name: 'calendar_basic',
    displayName: 'Calendar (Basic)',
    description: 'Basic calendar integration',
    category: 'productivity',
    dailyLimit: 20,
  },
  
  // Integration Tools
  gmail_basic: {
    name: 'gmail_basic',
    displayName: 'Gmail (Basic)',
    description: 'Send and read emails',
    category: 'integration',
    dailyLimit: 50,
  },
  gmail_advanced: {
    name: 'gmail_advanced',
    displayName: 'Gmail (Advanced)',
    description: 'Full Gmail integration with automation',
    category: 'integration',
  },
  notion_integration: {
    name: 'notion_integration',
    displayName: 'Notion Integration',
    description: 'Create and manage Notion pages',
    category: 'integration',
  },
  slack_integration: {
    name: 'slack_integration',
    displayName: 'Slack Integration',
    description: 'Send messages and manage Slack workspace',
    category: 'integration',
  },
  
  // Multimedia Tools
  image_generation: {
    name: 'image_generation',
    displayName: 'Image Generation',
    description: 'Generate AI images and graphics',
    category: 'multimedia',
    monthlyLimit: 100,
  },
  video_creation: {
    name: 'video_creation',
    displayName: 'Video Creation',
    description: 'Create AI-generated videos',
    category: 'multimedia',
    monthlyLimit: 20,
  },
  youtube_automation: {
    name: 'youtube_automation',
    displayName: 'YouTube Automation',
    description: 'Automated YouTube content creation',
    category: 'multimedia',
    monthlyLimit: 10,
  },
  
  // Advanced Tools
  custom_agent_config: {
    name: 'custom_agent_config',
    displayName: 'Custom Agent Configuration',
    description: 'Configure agents with custom prompts and behaviors',
    category: 'advanced',
  },
  api_access: {
    name: 'api_access',
    displayName: 'API Access',
    description: 'Direct API access to Qwenticinicial',
    category: 'advanced',
  },
};

// Tier Configurations
export const TIERS: Record<string, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    price: 0,
    description: 'Get started with basic AI assistance',
    agentAccess: ['coordinator', 'learning_coach', 'task_manager'],
    messagesPerMonth: 100,
    features: [
      'Access to 3 specialized agents',
      '100 messages per month',
      'Basic web search (10/day)',
      'Task management',
      'Cross-conversation memory',
    ],
    tools: [
      TOOLS.web_search_basic,
      TOOLS.task_management,
    ],
  },
  
  pro: {
    name: 'pro',
    displayName: 'Pro',
    price: 20,
    description: 'Unlock full AI orchestration with unlimited search',
    agentAccess: ['coordinator', 'learning_coach', 'teaching_assistant', 'research_agent', 'task_manager'],
    messagesPerMonth: 0, // Unlimited
    features: [
      'Access to all 5 agents',
      'Unlimited messages',
      'Unlimited web search',
      'News aggregation',
      'Gmail & Calendar integration',
      'Advanced research tools',
      'Priority support',
    ],
    tools: [
      TOOLS.web_search_unlimited,
      TOOLS.news_aggregation,
      TOOLS.task_management,
      TOOLS.calendar_basic,
      TOOLS.gmail_basic,
    ],
  },
  
  premium: {
    name: 'premium',
    displayName: 'Premium',
    price: 50,
    description: 'Ultimate AI power with multimedia creation',
    agentAccess: ['coordinator', 'learning_coach', 'teaching_assistant', 'research_agent', 'task_manager'],
    messagesPerMonth: 0, // Unlimited
    features: [
      'Everything in Pro',
      'AI image generation',
      'Video creation tools',
      'YouTube automation',
      'Notion & Slack integration',
      'Custom agent configuration',
      'API access',
      'Premium support',
    ],
    tools: [
      TOOLS.web_search_unlimited,
      TOOLS.news_aggregation,
      TOOLS.task_management,
      TOOLS.gmail_advanced,
      TOOLS.notion_integration,
      TOOLS.slack_integration,
      TOOLS.image_generation,
      TOOLS.video_creation,
      TOOLS.youtube_automation,
      TOOLS.custom_agent_config,
      TOOLS.api_access,
    ],
  },
};

// Check if user has access to a specific tool
export function hasToolAccess(userTier: string, toolName: string): boolean {
  const tier = TIERS[userTier] || TIERS.free;
  return tier.tools.some(tool => tool.name === toolName || toolName.startsWith(tool.name.split('_')[0]));
}

// Get user's tier configuration
export function getUserTierConfig(userTier: string): TierConfig {
  return TIERS[userTier] || TIERS.free;
}

// Check if user has reached tool usage limit
export function checkToolLimit(
  toolUsage: { dailyCount: number; monthlyCount: number } | null,
  toolName: string,
  userTier: string
): { allowed: boolean; reason?: string } {
  const tierConfig = getUserTierConfig(userTier);
  const tool = tierConfig.tools.find(t => t.name === toolName);
  
  if (!tool) {
    return { allowed: false, reason: `Tool ${toolName} not available in ${userTier} tier` };
  }
  
  if (!toolUsage) {
    return { allowed: true }; // First use
  }
  
  if (tool.dailyLimit && toolUsage.dailyCount >= tool.dailyLimit) {
    return { allowed: false, reason: `Daily limit of ${tool.dailyLimit} reached for ${tool.displayName}` };
  }
  
  if (tool.monthlyLimit && toolUsage.monthlyCount >= tool.monthlyLimit) {
    return { allowed: false, reason: `Monthly limit of ${tool.monthlyLimit} reached for ${tool.displayName}` };
  }
  
  return { allowed: true };
}
