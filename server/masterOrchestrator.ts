// Master Orchestrator - The Brain of Qwenticinicial
// Analyzes requests, creates execution plans, delegates to specialist agents

import OpenAI from "openai";
import { AGENTS, AgentRole, generateAgentResponse } from "./agentCoordinator";
import { storage } from "./storage";
import { getUserTierConfig, hasToolAccess, checkToolLimit } from "./tierConfig";
import { 
  checkAndProcessMessages, 
  getPendingMessagesForAgent,
  processAgentMessage 
} from "./agentCommunication";

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
  executionMode: 'sequential' | 'parallel' | 'mixed'; // Phase 3.1: Parallel execution support
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
  "executionMode": "sequential|parallel|mixed",
  "executionSteps": [
    {
      "stepNumber": 1,
      "agent": "agent_id",
      "action": "what this agent will do",
      "toolsUsed": ["tools_for_this_step"],
      "dependsOn": [previous_step_numbers_if_any]
    }
  ],
  "estimatedDuration": "time_estimate"
}

CRITICAL: Use ONLY the exact agent IDs shown in parentheses above (coordinator, learning_coach, teaching_assistant, research_agent, task_manager). 
NEVER use agent display names or create custom agent IDs!

Execution Modes:
- "sequential": Execute steps one at a time (use when steps must be in order)
- "parallel": Execute all steps simultaneously (use when steps are completely independent)
- "mixed": Automatically optimize - steps with dependencies run in sequence, independent steps run in parallel (RECOMMENDED)

IMPORTANT: 
- Only use agents and tools that are available to this user's tier
- Set dependsOn array for steps that require previous steps' results
- Leave dependsOn empty or omit it for independent steps`;

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
    executionMode: planData.executionMode || 'mixed', // Default to mixed (optimal)
  };

  // Validate agent IDs and tools in the plan
  validateExecutionPlan(plan, availableAgents, availableTools);

  console.log('📋 Execution Plan Created:', JSON.stringify(plan, null, 2));
  
  return plan;
}

/**
 * Validate that all agent IDs and tools in the execution plan are valid
 * Throws ValidationError with detailed information
 */
function validateExecutionPlan(plan: ExecutionPlan, availableAgents: string[], availableTools: string[]): void {
  const errors: string[] = [];
  
  // Validate primary agent
  if (!AGENTS[plan.primaryAgent]) {
    errors.push(`Invalid primary agent: "${plan.primaryAgent}" not found in agent registry`);
  } else if (!availableAgents.includes(plan.primaryAgent)) {
    errors.push(`Primary agent "${plan.primaryAgent}" not available for this user tier`);
  }
  
  // Validate collaborating agents
  plan.collaboratingAgents.forEach(agentId => {
    if (!AGENTS[agentId]) {
      errors.push(`Invalid collaborating agent: "${agentId}" not found in agent registry`);
    } else if (!availableAgents.includes(agentId)) {
      errors.push(`Collaborating agent "${agentId}" not available for this user tier`);
    }
  });
  
  // Validate agents in execution steps
  plan.executionSteps.forEach((step, index) => {
    if (!AGENTS[step.agent]) {
      errors.push(`Invalid agent in step ${step.stepNumber}: "${step.agent}" not found in agent registry`);
    } else if (!availableAgents.includes(step.agent)) {
      errors.push(`Agent "${step.agent}" in step ${step.stepNumber} not available for this user tier`);
    }
    
    // Validate tools in this step
    step.toolsUsed?.forEach(tool => {
      if (!availableTools.includes(tool)) {
        errors.push(`Tool "${tool}" in step ${step.stepNumber} not available for this user tier`);
      }
    });
  });
  
  // Validate tools needed in plan
  plan.toolsNeeded?.forEach(tool => {
    if (!availableTools.includes(tool)) {
      errors.push(`Tool "${tool}" in plan not available for this user tier`);
    }
  });
  
  // If any errors found, throw ValidationError with helpful message
  if (errors.length > 0) {
    const validationError = new Error(
      `Execution plan validation failed:\n${errors.join('\n')}\n\n` +
      `Valid agent IDs: ${Object.keys(AGENTS).join(', ')}\n` +
      `Available agents for this tier: ${availableAgents.join(', ')}\n` +
      `Available tools for this tier: ${availableTools.join(', ')}`
    );
    (validationError as any).isValidationError = true;
    (validationError as any).statusCode = 422;
    throw validationError;
  }
}

/**
 * Dependency Resolver - Groups steps by execution level for parallel execution
 * Level 0: Steps with no dependencies
 * Level 1: Steps depending only on Level 0
 * Level 2: Steps depending on Level 0 or 1, etc.
 * 
 * Includes cycle detection and dependency validation
 */
function resolveExecutionLevels(steps: ExecutionStep[]): ExecutionStep[][] {
  const levels: ExecutionStep[][] = [];
  const stepMap = new Map<number, ExecutionStep>();
  const stepLevels = new Map<number, number>();
  const visiting = new Set<number>(); // For cycle detection
  const visited = new Set<number>(); // For cycle detection
  
  // Build step map
  steps.forEach(step => stepMap.set(step.stepNumber, step));
  
  // Validate all dependencies exist
  for (const step of steps) {
    if (step.dependsOn && step.dependsOn.length > 0) {
      for (const depNum of step.dependsOn) {
        if (!stepMap.has(depNum)) {
          throw new Error(
            `Invalid dependency: Step ${step.stepNumber} depends on non-existent step ${depNum}. ` +
            `Available steps: ${Array.from(stepMap.keys()).join(', ')}`
          );
        }
        if (depNum === step.stepNumber) {
          throw new Error(`Invalid dependency: Step ${step.stepNumber} cannot depend on itself`);
        }
      }
    }
  }
  
  // Calculate level for each step with cycle detection
  function calculateLevel(step: ExecutionStep, path: number[] = []): number {
    // Already calculated
    if (stepLevels.has(step.stepNumber)) {
      return stepLevels.get(step.stepNumber)!;
    }
    
    // Cycle detection: Currently visiting this node
    if (visiting.has(step.stepNumber)) {
      const cyclePath = [...path, step.stepNumber].join(' → ');
      throw new Error(
        `Dependency cycle detected: ${cyclePath}. ` +
        `Cannot execute steps with circular dependencies.`
      );
    }
    
    // Mark as visiting
    visiting.add(step.stepNumber);
    
    // If no dependencies, it's level 0
    if (!step.dependsOn || step.dependsOn.length === 0) {
      stepLevels.set(step.stepNumber, 0);
      visiting.delete(step.stepNumber);
      visited.add(step.stepNumber);
      return 0;
    }
    
    // Calculate level = max(dependency levels) + 1
    const maxDepLevel = Math.max(...step.dependsOn.map(depNum => {
      const depStep = stepMap.get(depNum)!; // Safe because we validated above
      return calculateLevel(depStep, [...path, step.stepNumber]);
    }));
    
    const level = maxDepLevel + 1;
    stepLevels.set(step.stepNumber, level);
    visiting.delete(step.stepNumber);
    visited.add(step.stepNumber);
    return level;
  }
  
  // Assign all steps to levels
  for (const step of steps) {
    if (!visited.has(step.stepNumber)) {
      calculateLevel(step);
    }
  }
  
  // Group steps by level
  const maxLevel = Math.max(...Array.from(stepLevels.values()));
  for (let i = 0; i <= maxLevel; i++) {
    const levelSteps = steps.filter(step => stepLevels.get(step.stepNumber) === i);
    if (levelSteps.length > 0) {
      levels.push(levelSteps);
    }
  }
  
  return levels;
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
  
  console.log(`🚀 Executing orchestration plan (${plan.executionMode} mode)...`);
  
  const results: OrchestrationResult['results'] = [];
  const resultsMap = new Map<number, OrchestrationResult['results'][0]>();
  
  // Helper function to execute a single step
  const executeStep = async (step: ExecutionStep): Promise<void> => {
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
      resultsMap.set(step.stepNumber, {
        agent: step.agent,
        output: `Error: Unknown agent ${step.agent}`,
        toolsUsed: step.toolsUsed,
      });
      return;
    }
    
    // Phase 3.2: Check for pending agent messages first
    let agentMessageResults = '';
    try {
      const pendingMessages = await getPendingMessagesForAgent(step.agent, conversationId);
      
      if (pendingMessages.length > 0) {
        console.log(`  📨 Processing ${pendingMessages.length} pending messages for ${step.agent}...`);
        const messageResults = await checkAndProcessMessages(step.agent, conversationId, userId, userTier);
        
        if (messageResults.results.length > 0) {
          agentMessageResults = `\n\n[Sub-tasks completed by ${step.agent}]:\n` + 
            messageResults.results.map((r, i) => `${i + 1}. ${r}`).join('\n');
        }
      }
    } catch (error: any) {
      console.error(`  ⚠️  Agent message processing failed: ${error.message}`);
    }
    
    // Execute agent task
    try {
      // Build context with any sub-task results
      const taskContext = step.action + agentMessageResults;
      
      const agentResponse = await generateAgentResponse(
        step.agent as any,
        [{ role: "user", content: taskContext }],
        false, // Non-streaming for orchestration
        userId
      );
      
      const output = agentResponse.choices[0].message.content || '';
      
      resultsMap.set(step.stepNumber, {
        agent: agentConfig.name,
        output,
        toolsUsed: step.toolsUsed,
      });
      
      console.log(`  ✅ Step ${step.stepNumber} complete`);
      
    } catch (error: any) {
      console.error(`  ❌ Step ${step.stepNumber} failed:`, error.message);
      resultsMap.set(step.stepNumber, {
        agent: agentConfig.name,
        output: `Error: ${error.message}`,
        toolsUsed: step.toolsUsed,
      });
    }
  }
  
  // Execute based on mode
  if (plan.executionMode === 'sequential') {
    // Sequential: Execute one at a time
    for (const step of plan.executionSteps) {
      await executeStep(step);
    }
  } else if (plan.executionMode === 'parallel') {
    // Parallel: Execute all at once (ignoring dependencies)
    await Promise.all(plan.executionSteps.map(step => executeStep(step)));
  } else {
    // Mixed (optimal): Respect dependencies, parallelize where possible
    const executionLevels = resolveExecutionLevels(plan.executionSteps);
    console.log(`  📊 Execution levels: ${executionLevels.map(level => level.length).join(' → ')}`);
    
    for (let i = 0; i < executionLevels.length; i++) {
      const levelSteps = executionLevels[i];
      console.log(`  🔄 Level ${i}: Executing ${levelSteps.length} step(s) in parallel`);
      
      // Execute all steps in this level in parallel
      await Promise.all(levelSteps.map(step => executeStep(step)));
    }
  }
  
  // Sort results by step number
  plan.executionSteps.forEach(step => {
    const result = resultsMap.get(step.stepNumber);
    if (result) {
      results.push(result);
    }
  });
  
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

/**
 * Streaming Orchestration - Real-time SSE updates during execution
 */
export async function orchestrateStreaming(
  userMessage: string,
  conversationId: string,
  userId: string = 'default_user',
  userTier: string = 'free',
  onEvent: (event: any) => void
): Promise<void> {
  
  try {
    // Step 1: Analyze and create plan
    onEvent({ type: 'status', message: 'Analyzing request...' });
    const plan = await analyzeAndPlan(userMessage, userId, userTier);
    onEvent({ type: 'plan', plan });
    
    // Step 2: Execute steps with live updates (parallel execution)
    const results: any[] = [];
    const resultsMap = new Map<number, any>();
    
    // Helper function to execute a single step with SSE updates
    const executeStepStreaming = async (step: ExecutionStep): Promise<void> => {
      // Notify step start
      onEvent({ 
        type: 'step_start', 
        stepNumber: step.stepNumber,
        agent: step.agent,
        action: step.action 
      });
      
      try {
        // Check tool access
        for (const tool of step.toolsUsed) {
          if (!hasToolAccess(userTier, tool)) {
            throw new Error(`Tool ${tool} not available in ${userTier} tier. Upgrade to access this feature.`);
          }
        }
        
        // Get agent configuration
        const agentConfig = AGENTS[step.agent];
        if (!agentConfig) {
          throw new Error(`Unknown agent: ${step.agent}`);
        }
        
        // Execute agent task
        const agentResponse = await generateAgentResponse(
          step.agent as any,
          [{ role: "user", content: step.action }],
          false,
          userId
        );
        
        const output = agentResponse.choices[0].message.content || '';
        
        const result = {
          agent: agentConfig.name,
          output,
          toolsUsed: step.toolsUsed,
        };
        
        resultsMap.set(step.stepNumber, result);
        
        // Notify step completion
        onEvent({ 
          type: 'step_complete', 
          stepNumber: step.stepNumber,
          result 
        });
        
      } catch (error: any) {
        onEvent({ 
          type: 'step_error', 
          stepNumber: step.stepNumber,
          error: error.message 
        });
        
        resultsMap.set(step.stepNumber, {
          agent: AGENTS[step.agent]?.name || step.agent,
          output: `Error: ${error.message}`,
          toolsUsed: step.toolsUsed,
        });
      }
    }
    
    // Execute based on mode
    onEvent({ type: 'status', message: `Executing in ${plan.executionMode} mode...` });
    
    if (plan.executionMode === 'sequential') {
      // Sequential: Execute one at a time
      for (const step of plan.executionSteps) {
        await executeStepStreaming(step);
      }
    } else if (plan.executionMode === 'parallel') {
      // Parallel: Execute all at once
      await Promise.all(plan.executionSteps.map(step => executeStepStreaming(step)));
    } else {
      // Mixed (optimal): Respect dependencies, parallelize where possible
      const executionLevels = resolveExecutionLevels(plan.executionSteps);
      onEvent({ 
        type: 'status', 
        message: `${executionLevels.length} execution level(s): ${executionLevels.map(l => l.length).join(' → ')} step(s)` 
      });
      
      for (let i = 0; i < executionLevels.length; i++) {
        const levelSteps = executionLevels[i];
        
        if (levelSteps.length > 1) {
          onEvent({ type: 'status', message: `Level ${i}: Executing ${levelSteps.length} agents in parallel` });
        }
        
        // Execute all steps in this level in parallel
        await Promise.all(levelSteps.map(step => executeStepStreaming(step)));
      }
    }
    
    // Sort results by step number
    plan.executionSteps.forEach(step => {
      const result = resultsMap.get(step.stepNumber);
      if (result) {
        results.push(result);
      }
    });
    
    // Step 3: Compile final answer
    onEvent({ type: 'status', message: 'Compiling results...' });
    
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
    
    // Step 4: Send final result
    onEvent({ 
      type: 'complete',
      finalAnswer,
      success: true,
      plan,
      results 
    });
    
    // Step 5: Log orchestration
    await storage.createAgentInteraction({
      userId,
      conversationId,
      primaryAgent: plan.primaryAgent,
      collaboratingAgents: plan.collaboratingAgents,
      interactionType: 'collaborative',
      outcome: `Orchestrated: ${plan.executionSteps.length} steps completed`
    });
    
  } catch (error: any) {
    onEvent({ type: 'error', error: error.message });
    throw error;
  }
}
