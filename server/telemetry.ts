// Telemetry Service - Real-time tracking of orchestration metrics
// Tracks response times, success rates, costs, and performance data

import { storage } from "./storage";
import type { InsertAnalyticsEvent } from "@shared/schema";

// Token pricing (GPT-4o-mini rates)
const PRICING = {
  'gpt-4o-mini': {
    input: 0.15 / 1_000_000,  // $0.15 per 1M input tokens
    output: 0.60 / 1_000_000  // $0.60 per 1M output tokens
  }
};

export interface TelemetrySession {
  sessionId: string;
  userId: string;
  conversationId?: string;
  startTime: number;
  events: TelemetryEvent[];
}

export interface TelemetryEvent {
  type: 'orchestration_start' | 'orchestration_end' | 'agent_execution' | 'tool_execution' | 'error';
  timestamp: number;
  agentId?: string;
  toolName?: string;
  durationMs?: number;
  tokensUsed?: { input: number; output: number; total: number };
  cost?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
}

class TelemetryService {
  private activeSessions = new Map<string, TelemetrySession>();

  /**
   * Start tracking a new orchestration session
   */
  startSession(sessionId: string, userId: string, conversationId?: string): void {
    this.activeSessions.set(sessionId, {
      sessionId,
      userId,
      conversationId,
      startTime: Date.now(),
      events: []
    });
    
    console.log(`📊 Telemetry: Session ${sessionId} started`);
  }

  /**
   * Track an event within a session
   */
  trackEvent(sessionId: string, event: TelemetryEvent): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Telemetry: No active session found for ${sessionId}`);
      return;
    }

    event.timestamp = Date.now();
    session.events.push(event);
    
    console.log(`📊 Telemetry: Tracked ${event.type} for session ${sessionId}`);
  }

  /**
   * Track orchestration start
   */
  trackOrchestrationStart(sessionId: string): void {
    this.trackEvent(sessionId, {
      type: 'orchestration_start',
      timestamp: Date.now(),
      success: true
    });
  }

  /**
   * Track orchestration completion
   */
  trackOrchestrationEnd(sessionId: string, success: boolean, errorMessage?: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const duration = Date.now() - session.startTime;
    
    this.trackEvent(sessionId, {
      type: 'orchestration_end',
      timestamp: Date.now(),
      durationMs: duration,
      success,
      errorMessage
    });
  }

  /**
   * Track agent execution with timing and token usage
   */
  trackAgentExecution(
    sessionId: string, 
    agentId: string, 
    durationMs: number, 
    tokensUsed?: { input: number; output: number; total: number },
    success: boolean = true,
    errorMessage?: string
  ): void {
    const cost = tokensUsed ? this.calculateCost(tokensUsed.input, tokensUsed.output) : 0;

    this.trackEvent(sessionId, {
      type: 'agent_execution',
      timestamp: Date.now(),
      agentId,
      durationMs,
      tokensUsed,
      cost,
      success,
      errorMessage
    });
  }

  /**
   * Track tool execution
   */
  trackToolExecution(
    sessionId: string,
    toolName: string,
    agentId: string,
    durationMs: number,
    success: boolean = true,
    errorMessage?: string
  ): void {
    this.trackEvent(sessionId, {
      type: 'tool_execution',
      timestamp: Date.now(),
      agentId,
      toolName,
      durationMs,
      success,
      errorMessage
    });
  }

  /**
   * Track error events
   */
  trackError(
    sessionId: string,
    errorMessage: string,
    agentId?: string,
    toolName?: string,
    metadata?: any
  ): void {
    this.trackEvent(sessionId, {
      type: 'error',
      timestamp: Date.now(),
      agentId,
      toolName,
      success: false,
      errorMessage,
      metadata
    });
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = inputTokens * PRICING['gpt-4o-mini'].input;
    const outputCost = outputTokens * PRICING['gpt-4o-mini'].output;
    return inputCost + outputCost;
  }

  /**
   * Save session metrics to database and cleanup
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Telemetry: Cannot end session ${sessionId} - not found`);
      return;
    }

    console.log(`📊 Telemetry: Ending session ${sessionId}, saving ${session.events.length} events...`);

    // Save all events to database
    const savePromises = session.events.map(event => this.saveEvent(session, event));
    await Promise.all(savePromises);

    // Calculate and save aggregate metrics
    await this.saveAggregateMetrics(session);

    // Cleanup
    this.activeSessions.delete(sessionId);
    console.log(`✅ Telemetry: Session ${sessionId} completed and saved`);
  }

  /**
   * Save individual event to analytics
   */
  private async saveEvent(session: TelemetrySession, event: TelemetryEvent): Promise<void> {
    try {
      const analyticsEvent: InsertAnalyticsEvent = {
        userId: session.userId,
        eventType: event.type,
        eventCategory: this.getEventCategory(event.type),
        agentId: event.agentId || null,
        toolName: event.toolName || null,
        executionTimeMs: event.durationMs || null,
        tokensUsed: event.tokensUsed?.total || null,
        estimatedCost: event.cost ? event.cost.toFixed(6) : null,
        success: event.success ?? true,
        errorMessage: event.errorMessage || null,
        metadata: event.metadata || null
      };

      await storage.createAnalyticsEvent(analyticsEvent);
    } catch (error) {
      console.error('❌ Telemetry: Failed to save event:', error);
    }
  }

  /**
   * Calculate and save aggregate session metrics
   */
  private async saveAggregateMetrics(session: TelemetrySession): Promise<void> {
    const agentEvents = session.events.filter(e => e.type === 'agent_execution');
    const toolEvents = session.events.filter(e => e.type === 'tool_execution');
    const errorEvents = session.events.filter(e => !e.success);

    const totalDuration = session.events
      .filter(e => e.durationMs)
      .reduce((sum, e) => sum + (e.durationMs || 0), 0);

    const totalTokens = session.events
      .filter(e => e.tokensUsed)
      .reduce((sum, e) => sum + (e.tokensUsed?.total || 0), 0);

    const totalCost = session.events
      .filter(e => e.cost)
      .reduce((sum, e) => sum + (e.cost || 0), 0);

    const successRate = agentEvents.length > 0 
      ? ((agentEvents.length - errorEvents.length) / agentEvents.length * 100).toFixed(2)
      : '100';

    console.log(`📊 Session Metrics:
      - Duration: ${totalDuration}ms
      - Tokens: ${totalTokens}
      - Cost: $${totalCost.toFixed(6)}
      - Agent Executions: ${agentEvents.length}
      - Tool Executions: ${toolEvents.length}
      - Success Rate: ${successRate}%
      - Errors: ${errorEvents.length}
    `);
  }

  /**
   * Get event category for analytics
   */
  private getEventCategory(eventType: string): string {
    switch (eventType) {
      case 'orchestration_start':
      case 'orchestration_end':
        return 'usage';
      case 'agent_execution':
      case 'tool_execution':
        return 'performance';
      case 'error':
        return 'error';
      default:
        return 'usage';
    }
  }

  /**
   * Get current session metrics (for real-time monitoring)
   */
  getSessionMetrics(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const agentEvents = session.events.filter(e => e.type === 'agent_execution');
    const toolEvents = session.events.filter(e => e.type === 'tool_execution');
    
    const totalTokens = session.events
      .filter(e => e.tokensUsed)
      .reduce((sum, e) => sum + (e.tokensUsed?.total || 0), 0);

    const totalCost = session.events
      .filter(e => e.cost)
      .reduce((sum, e) => sum + (e.cost || 0), 0);

    return {
      sessionId,
      duration: Date.now() - session.startTime,
      agentExecutions: agentEvents.length,
      toolExecutions: toolEvents.length,
      totalTokens,
      totalCost,
      events: session.events.length
    };
  }
}

// Export singleton instance
export const telemetry = new TelemetryService();
