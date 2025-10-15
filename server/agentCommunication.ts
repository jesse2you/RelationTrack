// Phase 3.2: Agent-to-Agent Communication System
// Enables agents to create sub-tasks, send messages, and collaborate autonomously

import { storage } from "./storage";
import { InsertAgentMessage, AgentMessage } from "@shared/schema";
import { generateAgentResponse, AGENTS } from "./agentCoordinator";

export interface AgentMessageRequest {
  fromAgent: string;
  toAgent: string;
  taskType: 'research' | 'analysis' | 'learning' | 'task_creation' | 'information_request';
  taskData: {
    request: string;
    context?: string;
    priority?: number;
    deadline?: string;
  };
  conversationId?: string;
  parentStepNumber?: number;
  priority?: number;
}

export interface AgentMessageResponse {
  messageId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

/**
 * Create a new agent-to-agent message (sub-task)
 * This allows one agent to delegate work to another agent
 */
export async function createAgentMessage(
  request: AgentMessageRequest
): Promise<AgentMessageResponse> {
  
  console.log(`📨 Agent Communication: ${request.fromAgent} → ${request.toAgent}`);
  console.log(`   Task Type: ${request.taskType}`);
  console.log(`   Request: ${request.taskData.request.substring(0, 80)}...`);
  
  // Validate agents exist
  if (!AGENTS[request.fromAgent]) {
    throw new Error(`Invalid fromAgent: ${request.fromAgent}`);
  }
  if (!AGENTS[request.toAgent]) {
    throw new Error(`Invalid toAgent: ${request.toAgent}`);
  }
  
  // Create the message in storage
  const messageData: InsertAgentMessage = {
    conversationId: request.conversationId || null,
    fromAgent: request.fromAgent,
    toAgent: request.toAgent,
    taskType: request.taskType,
    taskData: request.taskData,
    status: 'pending',
    priority: request.priority || 1,
    parentStepNumber: request.parentStepNumber || null,
  };
  
  const message = await storage.createAgentMessage(messageData);
  
  return {
    messageId: message.id,
    status: message.status as 'pending' | 'in_progress' | 'completed' | 'failed',
  };
}

/**
 * Get pending messages for a specific agent
 * Agents can check for incoming work from other agents
 */
export async function getPendingMessagesForAgent(
  agentId: string,
  conversationId?: string
): Promise<AgentMessage[]> {
  
  const filters: any = {
    toAgent: agentId,
    status: 'pending',
  };
  
  if (conversationId) {
    filters.conversationId = conversationId;
  }
  
  const messages = await storage.getAgentMessages(filters);
  
  console.log(`📬 ${agentId} has ${messages.length} pending messages`);
  
  return messages;
}

/**
 * Update message status (e.g., mark as in_progress)
 */
export async function updateAgentMessageStatus(
  messageId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  result?: string,
  error?: string
): Promise<AgentMessage> {
  
  console.log(`📝 Updating message ${messageId.substring(0, 8)}... status: ${status}`);
  
  const updates: any = { status };
  
  if (result !== undefined) {
    updates.result = result;
  }
  
  if (error !== undefined) {
    updates.error = error;
  }
  
  if (status === 'completed' || status === 'failed') {
    updates.completedAt = new Date();
  }
  
  return await storage.updateAgentMessage(messageId, updates);
}

/**
 * Process a message - have the target agent execute the requested task
 * This is the core function that enables autonomous agent collaboration
 */
export async function processAgentMessage(
  message: AgentMessage,
  conversationId: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<string> {
  
  console.log(`⚙️  Processing agent message: ${message.id.substring(0, 8)}...`);
  console.log(`   From: ${message.fromAgent} → To: ${message.toAgent}`);
  console.log(`   Task: ${message.taskType}`);
  
  try {
    // Mark as in progress
    await updateAgentMessageStatus(message.id, 'in_progress');
    
    // Get the target agent
    const targetAgent = AGENTS[message.toAgent];
    if (!targetAgent) {
      throw new Error(`Agent ${message.toAgent} not found`);
    }
    
    // Build context for the agent
    const taskData = message.taskData as any;
    const contextMessage = `
[Agent Communication - Sub-task from ${message.fromAgent}]

Task Type: ${message.taskType}
Priority: ${message.priority || 1}

Request: ${taskData.request}

${taskData.context ? `Context: ${taskData.context}` : ''}

Please complete this task and provide a comprehensive response.
    `.trim();
    
    // Execute the task with the target agent
    const response = await generateAgentResponse(
      message.toAgent,
      [{ role: "user", content: contextMessage }],
      false, // Don't stream for agent-to-agent communication
      userId
    );
    
    // Extract the response content
    const responseText = response.choices[0].message.content || '';
    
    // Mark as completed with the result
    await updateAgentMessageStatus(message.id, 'completed', responseText);
    
    console.log(`✅ Message ${message.id.substring(0, 8)}... completed`);
    
    return responseText;
    
  } catch (error: any) {
    console.error(`❌ Error processing message ${message.id}:`, error.message);
    await updateAgentMessageStatus(message.id, 'failed', undefined, error.message);
    throw error;
  }
}

/**
 * Check and process any pending messages for an agent
 * This enables agents to handle incoming sub-tasks during their execution
 */
export async function checkAndProcessMessages(
  agentId: string,
  conversationId: string,
  userId: string = 'default_user',
  userTier: string = 'free'
): Promise<{ processed: number; results: string[] }> {
  
  const pendingMessages = await getPendingMessagesForAgent(agentId, conversationId);
  
  if (pendingMessages.length === 0) {
    return { processed: 0, results: [] };
  }
  
  console.log(`🔄 Processing ${pendingMessages.length} pending messages for ${agentId}...`);
  
  const results: string[] = [];
  
  // Process messages in priority order (higher priority first)
  const sortedMessages = pendingMessages.sort((a, b) => 
    (b.priority || 1) - (a.priority || 1)
  );
  
  for (const message of sortedMessages) {
    try {
      const result = await processAgentMessage(message, conversationId, userId, userTier);
      results.push(result);
    } catch (error: any) {
      console.error(`Failed to process message ${message.id}:`, error.message);
      results.push(`ERROR: ${error.message}`);
    }
  }
  
  return { processed: pendingMessages.length, results };
}

/**
 * Get conversation message history for inter-agent coordination
 * Agents can use this to understand what other agents have done
 */
export async function getAgentConversationHistory(
  conversationId: string,
  limit: number = 20
): Promise<AgentMessage[]> {
  
  const messages = await storage.getAgentMessages({
    conversationId,
    limit,
  });
  
  // Sort by creation time (newest last)
  return messages.sort((a: AgentMessage, b: AgentMessage) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Enable an agent to create a sub-task during execution
 * This is the key function agents will call to delegate work
 */
export async function delegateSubTask(
  fromAgent: string,
  toAgent: string,
  taskDescription: string,
  taskType: 'research' | 'analysis' | 'learning' | 'task_creation' | 'information_request',
  conversationId: string,
  options?: {
    context?: string;
    priority?: number;
    parentStepNumber?: number;
  }
): Promise<AgentMessageResponse> {
  
  console.log(`🔀 ${fromAgent} delegating ${taskType} task to ${toAgent}`);
  
  return await createAgentMessage({
    fromAgent,
    toAgent,
    taskType,
    taskData: {
      request: taskDescription,
      context: options?.context,
      priority: options?.priority,
    },
    conversationId,
    parentStepNumber: options?.parentStepNumber,
    priority: options?.priority || 1,
  });
}
