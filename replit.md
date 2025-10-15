# Qwenticinicial - Multi-Agent AI Orchestration Platform

## Overview
Qwenticinicial is envisioned as an n8n-style autonomous multi-agent orchestration platform where a Master Orchestrator delegates tasks to specialist AI agents for autonomous execution and results compilation. The project aims to provide an affordable, multi-agent AI Learning Hub that intelligently routes requests, offers real-time visual orchestration, and works seamlessly across devices. Key capabilities include multi-agent chat, cross-conversation memory, agent collaboration, and organization tools.

## User Preferences
I prefer iterative development and want to be involved in the decision-making process for major changes. Ask before making significant architectural shifts or adding new, complex features. I value clear, concise communication and detailed explanations when new concepts or features are introduced. Do not make changes to the `shared/schema.ts` file without explicit approval, as it defines core data models.

## System Architecture
The platform operates as a single, unified application combining frontend, backend, and database components.

**UI/UX Decisions:**
- **Design:** Signature purple/pink/cyan gradient interface with frosted glass effects.
- **Responsiveness:** Mobile-first approach with full support for phones and tablets, including a collapsible sidebar and touch-friendly controls.
- **Theming:** Full dark mode support.
- **Real-time Feedback:** Real-time SSE streaming for live agent status updates during orchestration via a visual dashboard (`/orchestrate`).

**Technical Implementations:**
- **Multi-Agent System:** Five specialized AI agents (Learning Coach, Teaching Assistant, Research Agent, Task Manager, Head Coordinator) are coordinated by a Master Orchestrator.
- **Agent Orchestration:** The Master Orchestrator analyzes user requests, creates execution plans, and delegates tasks. It supports parallel execution where multiple agents work simultaneously with smart dependency resolution.
- **Cost Optimization:** Implemented through smart agent routing, cost-optimized model selection (e.g., `gpt-4o-mini` for most agents), context window management (last 10 messages), and an efficient architecture to minimize API calls and token usage.
- **Memory System:** Cross-conversation memory allows agents to retain context across interactions.
- **Voice Control:** Speech-to-text input and text-to-speech responses using the Web Speech API.
- **Organization Tools:** Includes MeetingMate for tasks, meetings, and schedules, and RelationTrack CRM for managing companies, contacts, projects, communications, and research.
- **Admin Panel:** A secure dashboard for platform management, including analytics and a private AI assistant for admins.

**Feature Specifications:**
- **Agent Routing:** Keyword-based scoring selects the most appropriate agent for a task, with the Head Coordinator serving as a fallback.
- **Parallel Execution Engine:** Supports sequential, parallel, and mixed execution modes with a DAG-based dependency resolver and cycle detection for efficient multi-agent workflows.
- **Agent-to-Agent Communication (Phase 3.2):** Agents can create asynchronous sub-tasks for other agents during execution via the `delegate_task` tool. Messages are stored in the database and processed automatically during orchestration, enabling true autonomous collaboration.
- **Data Persistence:** All conversations and user data are stored in a PostgreSQL database.

**Project Structure:**
- `client/`: Frontend developed with React, TypeScript, and Tailwind CSS.
- `server/`: Backend built with Express.js and Node.js, housing the agent coordinator, API routes, and database operations.
- `shared/schema.ts`: Defines shared data models.
- `db/`: PostgreSQL database.

## External Dependencies
- **AI Integration:** OpenAI API (via Replit AI Integrations, no API key required).
- **Database:** PostgreSQL (Replit built-in).
- **Authentication:** Replit Auth with session management.
- **UI Components:** Lucide Icons.