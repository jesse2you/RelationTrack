// Master Orchestrator - The Brain of Qwenticinicial
// Analyzes requests, creates execution plans, delegates to specialist agents

import OpenAI from "openai";
import { AGENTS, AgentRole, generateAgentResponse } from "./agentCoordinator";
import { storage } from "./storage";
import { getUserTierConfig, hasToolAccess, checkToolLimit } from "./tierConfig";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
  dependsOn?: number[]; // Which steps must complete first
}

export interface OrchestrationResult {
  success: boolean;
  plan: ExecutionPlan;
  results: {
    agent: string;
    output: string;
    toolsUsed: string[];
  }[];
  finalAnswer: string;
}

/**
 * Master Orchestrator - Analyzes user request and creates execution plan
 */
export async function analyzeAndPlan(
  userMessage: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<ExecutionPlan> {
  
  console.log('🧠 Master Orchestrator analyzing request...');
  
  // Get user's tier configuration
  const tierConfig = getUserTierConfig(userTier);
  const availableAgents = tierConfig.agentAccess;
  const availableTools = tierConfig.tools.map(t => t.name);
  
  // Orchestrator analyzes the request and creates a plan
  const systemPrompt = `You are the Master Orchestrator for Qwenticinicial - an AI agent orchestration platform.

Your job: Analyze user requests and create execution plans for specialist agents.

Available Agents:
${availableAgents.map(agentId => {
  const agent = AGENTS[agentId];
  return `- ${agent.name} (${agentId}): ${agent.description}`;
}).join('\n')}

Available Tools (based on ${tierConfig.displayName} tier):
${availableTools.map(tool => `- ${tool}`).join('\n')}

Your Task:
1. Understand what the user wants to accomplish
2. Determine which agents are best suited
3. Identify which tools are needed
4. Create a step-by-step execution plan
5. Consider if agents need to work in parallel or sequence

Return a JSON object with this structure:
{
  "primaryAgent": "agent_id_that_leads",
  "collaboratingAgents": ["other_agents_if_needed"],
  "toolsNeeded": ["tools_required"],
  "executionSteps": [
    {
      "stepNumber": 1,
      "agent": "agent_id",
      "action": "what this agent will do",
      "toolsUsed": ["tools_for_this_step"],
      "dependsOn": [previous_step_numbers]
    }
  ],
  "estimatedDuration": "time_estimate"
}

IMPORTANT: Only use agents and tools that are available to this user's tier.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Using mini for cost-effective planning
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze this request and create an execution plan:\n\n"${userMessage}"` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const planData = JSON.parse(response.choices[0].message.content || '{}');
  
  const plan: ExecutionPlan = {
    analysisId: `analysis_${Date.now()}`,
    primaryAgent: planData.primaryAgent || 'coordinator',
    collaboratingAgents: planData.collaboratingAgents || [],
    toolsNeeded: planData.toolsNeeded || [],
    executionSteps: planData.executionSteps || [],
    estimatedDuration: planData.estimatedDuration || 'unknown',
  };

  console.log('📋 Execution Plan Created:', JSON.stringify(plan, null, 2));
  
  return plan;
}

/**
 * Execute the orchestration plan
 */
export async function executePlan(
  plan: ExecutionPlan,
  userMessage: string,
  conversationId: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<OrchestrationResult> {
  
  console.log('🚀 Executing orchestration plan...');
  
  const results: OrchestrationResult['results'] = [];
  
  // Execute steps in order (respecting dependencies)
  for (const step of plan.executionSteps) {
    console.log(`  Step ${step.stepNumber}: ${step.agent} - ${step.action}`);
    
    // Check tool access
    for (const tool of step.toolsUsed) {
      if (!hasToolAccess(userTier, tool)) {
        throw new Error(`Tool ${tool} not available in ${userTier} tier. Upgrade to access this feature.`);
      }
    }
    
    // Get agent configuration
    const agentConfig = AGENTS[step.agent];
    if (!agentConfig) {
      console.error(`❌ Unknown agent: ${step.agent}`);
      continue;
    }
    
    // Execute agent task
    try {
      const agentResponse = await generateAgentResponse(
        step.agent as any,
        [{ role: "user", content: step.action }],
        false, // Non-streaming for orchestration
        userId
      );
      
      const output = agentResponse.choices[0].message.content || '';
      
      results.push({
        agent: agentConfig.name,
        output,
        toolsUsed: step.toolsUsed,
      });
      
      console.log(`  ✅ Step ${step.stepNumber} complete`);
      
    } catch (error: any) {
      console.error(`  ❌ Step ${step.stepNumber} failed:`, error.message);
      results.push({
        agent: agentConfig.name,
        output: `Error: ${error.message}`,
        toolsUsed: step.toolsUsed,
      });
    }
  }
  
  // Compile final answer
  const compilationPrompt = `You are compiling results from multiple AI agents into a final answer.

User's Original Question: "${userMessage}"

Agent Results:
${results.map((r, i) => `${i + 1}. ${r.agent}:\n${r.output}`).join('\n\n')}

Create a comprehensive, well-organized final answer that:
1. Directly answers the user's question
2. Integrates insights from all agents
3. Is clear and actionable
4. Credits agents when relevant

Final Answer:`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: compilationPrompt }],
    temperature: 0.7,
  });

  const finalAnswer = finalResponse.choices[0].message.content || 'Unable to compile results';
  
  console.log('✨ Orchestration complete!');
  
  return {
    success: true,
    plan,
    results,
    finalAnswer,
  };
}

/**
 * Master Orchestration - Single entry point for autonomous execution
 */
export async function orchestrate(
  userMessage: string,
  conversationId: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<OrchestrationResult> {
  
  // Step 1: Analyze and create plan
  const plan = await analyzeAndPlan(userMessage, userId, userTier);
  
  // Step 2: Execute the plan
  const result = await executePlan(plan, userMessage, conversationId, userId, userTier);
  
  // Step 3: Log orchestration
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
