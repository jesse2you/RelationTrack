# 🎯 MASTER PLAN - Qwenticinicial Development Roadmap

**⚠️ CRITICAL: Read this file FIRST in every new AI session**

**Last Updated:** October 15, 2025

---

## 📖 Essential Reading (In Order)

1. **VISION.md** - Understand the n8n-style autonomous orchestration architecture
2. **replit.md** - Current implementation status and technical details
3. **CONSOLIDATION_BLUEPRINT.md** - Complete file structure and integration guide
4. **This file (MASTER_PLAN.md)** - Current progress and next steps

---

## 🎯 The TRUE Vision

**Qwenticinicial is NOT a chat app.** It's an **n8n-style autonomous multi-agent orchestration platform** where:

1. **Master Orchestrator** analyzes user requests
2. Creates **execution plans**
3. **Delegates to specialist agents** (parallel execution)
4. Agents work **autonomously** with their tools
5. Results **compiled automatically**
6. Visual dashboard shows **real-time orchestration**

**Success = User submits ONE request → Multiple agents execute autonomously → Complete answer delivered**

---

## ✅ Current Implementation Status (UPDATED)

### **Phase 1: Core Infrastructure (COMPLETE)** ✅
- ✅ 5 AI Agents: Learning Coach, Research Agent, Task Manager, Teaching Assistant, Head Coordinator
- ✅ Master Orchestrator (`server/masterOrchestrator.ts`)
- ✅ Agent routing & coordination (`server/agentCoordinator.ts`)
- ✅ Cross-conversation memory system
- ✅ PostgreSQL database with 19 tables
- ✅ Tier system (FREE/PRO/PREMIUM) infrastructure
- ✅ Authentication (Replit Auth)
- ✅ Mobile-responsive UI

### **Phase 1: Features Working** ✅
- ✅ Multi-agent chat interface
- ✅ Keyword-based agent routing
- ✅ Streaming AI responses
- ✅ Tasks, Meetings, Schedules management
- ✅ User memory across conversations
- ✅ Agent interaction logging
- ✅ Admin dashboard

### **Phase 1: CRM System (COMPLETE)** ✅
- ✅ Database: 5 tables (companies, contacts, projects, communications, research)
- ✅ Backend: 30+ API endpoints with full CRUD
- ✅ Storage layer: 25+ database methods
- ✅ Frontend: Complete dashboard with create/edit/delete functionality
- ✅ Full CRUD operations for all 5 entity types
- ✅ Dialog-based forms with validation
- ✅ Error handling on all mutations
- ✅ Architect-approved and tested
- 🎉 **STATUS: PRODUCTION READY**

### **Phase 2: Visual Orchestration Dashboard (CODE COMPLETE)** ⚠️
- ✅ Real-time agent status cards (5 agents with Active/Idle indicators)
- ✅ Execution timeline with progressive rendering
- ✅ SSE streaming backend: `orchestrateStreaming()` function
- ✅ SSE endpoint: `POST /api/orchestrate/stream`
- ✅ Frontend SSE consumer using fetch().body.getReader()
- ✅ Agent activity animations (pulse effects, color transitions)
- ✅ Live status bar with progress messages
- ⚠️ **BLOCKED:** Needs app restart to register new SSE route
- 📝 **FILES MODIFIED:** 
  - `server/routes.ts` - Added SSE streaming endpoint
  - `server/masterOrchestrator.ts` - Added `orchestrateStreaming()` function
  - `client/src/pages/Orchestration.tsx` - Rebuilt with SSE consumer

---

## 🚨 CRITICAL ISSUES (Must Fix First)

### **Issue #1: Server Stability - APP RESTART REQUIRED** 🔥

**Problem:** Server repeatedly disconnecting (see logs: "server connection lost. Polling for restart...")

**Impact:**
- New SSE endpoint `/api/orchestrate/stream` returns Vite HTML instead of SSE stream
- Cannot test real-time orchestration
- Visual dashboard non-functional

**Root Cause:**
- No workflow configured in Replit
- New routes require manual app restart to register

**FIX REQUIRED:**
1. Click **"Run" button in Replit** to restart the app
2. This will register the new `/api/orchestrate/stream` route
3. Enable SSE streaming for real-time orchestration

**Alternative Fix:**
- Configure workflow: Set up `npm run dev` as startup command in Replit

---

## 🎯 CURRENT PRIORITIES (In Order)

### **Priority 1: Fix Server & Test Phase 2** 🔥
**Status:** BLOCKED - Needs user action (app restart)

**Actions:**
1. ✅ Code complete (SSE streaming fully implemented)
2. ⏳ **USER ACTION NEEDED:** Click "Run" in Replit to restart app
3. ⏳ Test SSE streaming orchestration end-to-end
4. ⏳ Verify real-time agent status updates
5. ⏳ Mark Phase 2 as fully complete

**Expected Result:** `/orchestrate` page shows live agent activity, progressive execution timeline, and real-time status updates

---

### **Priority 2: Phase 3 - Autonomous Multi-Step Workflows** 🤖

**Goal:** Enable true autonomous execution where agents work without user intervention

#### **3.1 Parallel Agent Execution**
**What:** Multiple agents execute simultaneously instead of sequentially

**Implementation:**
```typescript
// server/masterOrchestrator.ts
- Modify executePlan() to support parallel execution
- Add execution mode: 'sequential' | 'parallel' | 'mixed'
- Use Promise.all() for parallel agent tasks
- Handle partial failures gracefully
```

**Files to Modify:**
- `server/masterOrchestrator.ts` - Add parallel execution logic
- `shared/schema.ts` - Add execution mode to ExecutionStep type

**Expected Outcome:**
- User request: "Research AI trends AND create a summary"
- Research Agent and Teaching Assistant execute in parallel
- Results compile when both complete
- 2x faster execution for independent tasks

---

#### **3.2 Agent-to-Agent Communication**
**What:** Agents can create sub-tasks for other agents mid-execution

**Implementation:**
```typescript
// New file: server/agentCommunication.ts
- createSubTask(fromAgent, toAgent, task) function
- Agent messaging queue
- Task dependency tracking
- Result passing between agents
```

**Database Schema Addition:**
```typescript
// shared/schema.ts
agent_messages {
  id: varchar
  fromAgent: string
  toAgent: string
  taskType: string
  taskData: json
  status: 'pending' | 'in_progress' | 'completed'
  result: text
  createdAt: timestamp
}
```

**Files to Create/Modify:**
- `server/agentCommunication.ts` - New file for agent messaging
- `shared/schema.ts` - Add agent_messages table
- `server/masterOrchestrator.ts` - Integrate agent communication

**Expected Outcome:**
- Learning Coach analyzing a topic → creates sub-task for Research Agent
- Research Agent completes research → sends results back
- Learning Coach uses research to enhance learning plan
- True collaborative autonomous behavior

---

#### **3.3 Background Task Execution**
**What:** "Fire & forget" mode for long-running orchestrations

**Implementation:**
```typescript
// New file: server/taskQueue.ts
- Job queue for background tasks (using in-memory queue or Bull/BullMQ)
- Task status tracking
- User notifications on completion
- Results persistence
```

**Database Schema Addition:**
```typescript
// shared/schema.ts
background_tasks {
  id: varchar
  userId: string
  conversationId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  plan: json
  results: json
  createdAt: timestamp
  completedAt: timestamp
}
```

**API Endpoints to Add:**
```typescript
POST /api/orchestrate/background - Start background orchestration
GET /api/tasks/:id/status - Check task status
GET /api/tasks/user/:userId - List user's background tasks
DELETE /api/tasks/:id - Cancel running task
```

**Files to Create/Modify:**
- `server/taskQueue.ts` - New file for background job processing
- `server/routes.ts` - Add background task endpoints
- `shared/schema.ts` - Add background_tasks table
- `client/src/pages/Tasks.tsx` - UI for viewing background tasks

**Expected Outcome:**
- User: "Research competitors and create a 50-page report" (long task)
- Master Orchestrator: "This will take 10+ minutes, run in background?"
- Task runs autonomously, user gets notification when done
- User can check progress at `/tasks`

---

#### **3.4 Smart Dependency Resolution**
**What:** Automatic detection and handling of task dependencies

**Implementation:**
```typescript
// server/dependencyResolver.ts
- Analyze execution steps for dependencies
- Build dependency graph (DAG)
- Determine optimal execution order
- Enable parallel execution where possible
```

**Algorithm:**
```typescript
function resolveDependencies(steps: ExecutionStep[]): ExecutionPlan {
  // 1. Build dependency graph
  // 2. Topological sort for execution order
  // 3. Identify parallel execution opportunities
  // 4. Return optimized execution plan
}
```

**Files to Create/Modify:**
- `server/dependencyResolver.ts` - New file for dependency logic
- `server/masterOrchestrator.ts` - Integrate dependency resolver

**Expected Outcome:**
- Step 1: Research topic (no dependencies) → Execute immediately
- Step 2: Analyze research (depends on Step 1) → Wait for Step 1
- Step 3: Create summary (depends on Step 2) → Wait for Step 2
- Step 4: Schedule meeting (no dependencies) → Execute in parallel with Steps 1-3
- Automatic optimization for fastest execution

---

#### **3.5 Automatic Retry & Fallback Logic**
**What:** Resilient execution with automatic error recovery

**Implementation:**
```typescript
// server/retryLogic.ts
- Retry failed steps (max 3 attempts)
- Exponential backoff between retries
- Fallback to alternative agents on persistent failure
- Graceful degradation
```

**Configuration:**
```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: [1000, 5000, 15000],
  fallbackAgents: {
    'learning_coach': ['teaching_assistant', 'coordinator'],
    'research_agent': ['learning_coach', 'coordinator']
  }
}
```

**Files to Create/Modify:**
- `server/retryLogic.ts` - New file for retry/fallback logic
- `server/masterOrchestrator.ts` - Integrate retry logic
- `server/tierConfig.ts` - Add retry limits per tier

**Expected Outcome:**
- Agent fails with timeout → Retry automatically
- Agent fails 3 times → Fallback to alternative agent
- Critical failure → Graceful error message to user
- 99% orchestration success rate

---

### **Phase 3 Summary**

**Total Implementation Effort:**
- **New Files:** 4 (agentCommunication.ts, taskQueue.ts, dependencyResolver.ts, retryLogic.ts)
- **Modified Files:** 5 (masterOrchestrator.ts, routes.ts, schema.ts, tierConfig.ts, Tasks.tsx)
- **New Database Tables:** 2 (agent_messages, background_tasks)
- **New API Endpoints:** 8+
- **Estimated Time:** 2-3 development sessions

**Success Criteria:**
- ✅ Multiple agents execute in parallel
- ✅ Agents communicate and create sub-tasks
- ✅ Long-running tasks execute in background
- ✅ Dependencies auto-resolved
- ✅ Failed steps auto-retry with fallback
- ✅ True autonomous execution achieved

---

## 🎯 Phase 4: Tier System & Monetization (Future)

### **Goal:** Enable paid tiers with advanced features

**Pro Tier ($20/month):**
- Unlimited messages (vs 100/month free)
- Advanced orchestration (parallel + background)
- Custom agent configurations
- Enhanced memory capacity (unlimited vs 50 memories)
- Priority execution queue

**Premium Tier ($50/month):**
- Everything in Pro
- Video Creator Agent (automated video generation)
- YouTube Agent (content planning, scripting, production)
- Movie Maker Agent (multi-scene video compilation)
- Extended API integrations (Gmail, Calendar, Notion, Drive)
- White-label options

**Implementation:**
- `server/tierConfig.ts` - Feature gates and limits
- `client/src/components/TierUpgrade.tsx` - Upgrade prompts
- Payment integration (Stripe via Replit integration)
- Usage tracking and enforcement

---

## 🗂️ Database Schema Summary

### **Core Tables (19 total)**
1. `conversations` - Chat history
2. `messages` - All messages with agent metadata
3. `users` - Authentication & admin status
4. `user_memory` - Cross-conversation knowledge
5. `user_tiers` - Subscription levels
6. `agent_interactions` - Collaboration log
7. `agent_tasks` - Orchestrated task assignments
8. `tool_usage` - Usage tracking per user

### **Organization (MeetingMate)**
9. `tasks` - Task management
10. `meetings` - Meeting tracking
11. `schedules` - Schedule management

### **CRM (RelationTrack)**
12. `companies` - Organization data
13. `contacts` - Contact information
14. `projects` - Project tracking
15. `communications` - Email/SMS/Call logs
16. `research` - Research notes & insights

### **System**
17. `sessions` - Session storage
18. `user_settings` - User preferences
19. `user_feedback` - Feedback & ratings

### **Phase 3 Tables (PLANNED - Not Yet Implemented)**
- `agent_messages` - Agent-to-agent communication
- `background_tasks` - Background job queue

**⚠️ Note:** Phase 3 tables must be added to `shared/schema.ts` and synced with `npm run db:push --force` before use.

---

## 🔧 Technical Stack

**Frontend:**
- React + TypeScript
- Tailwind CSS + Shadcn UI
- TanStack Query (data fetching)
- Wouter (routing)
- Vite (build tool)

**Backend:**
- Node.js + Express
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon)
- OpenAI API (via Replit AI Integrations)

**Infrastructure:**
- Replit hosting
- Single app on port 5000 (frontend + backend)
- Environment secrets managed via Replit

---

## 📝 Development Guidelines

### **When Starting Work:**
1. ✅ Read VISION.md to understand the goal
2. ✅ Read this MASTER_PLAN.md for current status
3. ✅ Check current task list (`read_task_list` tool)
4. ✅ Review relevant files before editing

### **Code Standards:**
- Follow existing patterns in codebase
- Use TypeScript strict mode
- Add data-testid to all interactive elements
- Validate inputs with Zod schemas
- Use TanStack Query for API calls
- Update replit.md after significant changes

### **Testing:**
- Use `run_test` tool for e2e playwright tests
- Test on mobile AND desktop
- Verify all CRUD operations work
- Check agent responses stream correctly

### **Before Completing:**
1. Call `architect` tool to review changes
2. Fix any critical issues identified
3. Update relevant documentation
4. Mark tasks as completed with architect review

---

## 🚀 Success Metrics

**The system is working correctly when:**
- ✅ User submits ONE request
- ✅ Multiple agents execute WITHOUT user intervention
- ✅ Agents execute in parallel (Phase 3)
- ✅ Agents communicate and collaborate (Phase 3)
- ✅ Long tasks run in background (Phase 3)
- ✅ Results compile automatically
- ✅ Visual dashboard shows orchestration
- ✅ Complete answer delivered

**NOT working if:**
- ❌ User manually selects agents
- ❌ Agents need step-by-step user input
- ❌ No autonomous execution
- ❌ No visual orchestration view
- ❌ Only sequential execution (no parallelism)

---

## 📋 Development Roadmap

### **Completed:**
1. ✅ Phase 1: Core Infrastructure
2. ✅ Phase 1: CRM System (Full CRUD)
3. ✅ Phase 2: Visual Orchestration Dashboard (code complete)

### **In Progress:**
1. ⏳ Phase 2: Test & deploy SSE streaming (blocked - needs restart)

### **Next Up:**
1. 🎯 Phase 3.1: Parallel agent execution
2. 🎯 Phase 3.2: Agent-to-agent communication
3. 🎯 Phase 3.3: Background task queue
4. 🎯 Phase 3.4: Dependency resolution
5. 🎯 Phase 3.5: Retry & fallback logic

### **Future:**
1. 🔮 Phase 4: Tier system & monetization
2. 🔮 Premium features (Video/YouTube agents)
3. 🔮 Extended integrations (Gmail, Calendar, Notion)

---

## 🔧 Technical Debt & Known Issues

### **Critical:**
1. **Server stability** - Repeated disconnections, needs workflow configuration
2. **SSE endpoint** - Not accessible until app restart

### **Medium:**
1. No integration tests for orchestration (only manual Playwright)
2. MASTER_PLAN.md was outdated (NOW FIXED)
3. Memory system could use optimization (compaction, archival)

### **Low:**
1. No visual orchestration history (only current execution)
2. No user-facing error explanations (technical errors shown)
3. Mobile orchestration view could be enhanced

---

## 💡 Key Principles

1. **Autonomous First** - Agents work without constant user input
2. **Visual Orchestration** - User sees the AI army at work
3. **Shared Intelligence** - All agents access same knowledge
4. **Self-Organizing** - Master orchestrates, specialists execute
5. **Scalable Architecture** - Ready for multimedia/advanced tools
6. **Resilient Execution** - Automatic retry, fallback, and error recovery

---

## 🎬 Immediate Next Steps

**For User:**
1. **Click "Run" in Replit** to restart the app
2. Test orchestration dashboard at `/orchestrate`
3. Verify SSE streaming works
4. Approve Phase 2 completion

**For AI Agent:**
1. Once app restarted, test SSE orchestration
2. Mark Phase 2 tasks complete with architect review
3. Begin Phase 3.1: Parallel agent execution
4. Update replit.md with Phase 2/3 progress

---

**Remember: This is an n8n-style autonomous agent orchestration platform, NOT just a chat app.**

All AI agents working on this project MUST read this file first.
