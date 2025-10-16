# Qwenticinicial 🤖

An autonomous multi-agent AI orchestration platform where a Master Orchestrator intelligently delegates tasks to specialized AI agents for autonomous execution and results compilation.

## 🌟 Overview

Qwenticinicial is an n8n-style AI Learning Hub that provides intelligent request routing, real-time visual orchestration, and seamless cross-device functionality. Think of it as having a team of AI specialists working together to help you learn, research, and organize your work.

## ✨ Key Features

### 🎯 Multi-Agent Orchestration
- **Master Orchestrator**: Analyzes requests and creates execution plans
- **5 Specialized Agents**:
  - **Learning Coach**: Personalized learning guidance and study strategies
  - **Teaching Assistant**: Explains concepts and answers questions
  - **Research Agent**: Gathers information and conducts research
  - **Task Manager**: Organizes tasks, schedules, and deadlines
  - **Head Coordinator**: General coordination and fallback agent

### 🔄 Autonomous Agent Collaboration
- Agents work independently and in parallel
- Agent-to-agent communication for complex tasks
- Smart dependency resolution for multi-step workflows
- Real-time visual workflow display

### 💎 Tier-Based Pricing
- **FREE**: Basic features with limited web search (5 results)
- **PRO**: Enhanced capabilities with extended search (10 results)
- **PREMIUM**: Full access with maximum search results (10 results)

### 🧠 Advanced Capabilities
- **Cross-Conversation Memory**: Agents retain context across interactions
- **Web Search Integration**: Powered by Tavily API
- **Voice Control**: Speech-to-text input and text-to-speech responses
- **Real-Time Analytics**: Comprehensive performance tracking and cost metrics
- **Visual Orchestration Dashboard**: See agents working in real-time

### 🗂️ Organization Tools
- **MeetingMate**: Task management, meetings, and schedules
- **RelationTrack CRM**: Manage companies, contacts, projects, and communications

### 📊 Analytics & Performance
- Real-time telemetry tracking
- Agent execution time monitoring
- Token usage and cost metrics
- Performance optimizations with intelligent caching
- Admin dashboard with recharts visualizations

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Recharts** for analytics visualization
- **Lucide React** for icons

### Backend
- **Express.js** with Node.js
- **PostgreSQL** database (Neon-backed)
- **Drizzle ORM** for database operations
- **OpenAI API** for AI agent capabilities
- **Tavily API** for web search

### DevOps & Performance
- **Replit Auth** with session management
- **Server-Sent Events (SSE)** for real-time streaming
- **In-memory caching** with TTL
- **Telemetry system** for monitoring

## 🏗️ Architecture

```
User Request
    ↓
Master Orchestrator (analyzes & creates execution plan)
    ↓
Parallel/Sequential Execution
    ↓
Specialized Agents (with tool execution)
    ↓
Results Compilation
    ↓
User Response
```

### Agent Routing
- Keyword-based scoring system
- Automatic agent selection based on request content
- Head Coordinator serves as fallback

### Execution Modes
- **Sequential**: Tasks run one after another
- **Parallel**: Independent tasks run simultaneously
- **Mixed**: Smart dependency resolution with DAG-based planning

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- OpenAI API access (via Replit AI Integrations)
- Tavily API key (optional, for web search)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/qwenticinicial.git
cd qwenticinicial
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Required
DATABASE_URL=your_postgres_url
SESSION_SECRET=your_session_secret

# Optional
TAVILY_API_KEY=your_tavily_key
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the application:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## 📖 Usage

### Basic Chat
Navigate to the home page and start chatting. The Master Orchestrator will automatically route your request to the appropriate agents.

### Visual Orchestration
Visit `/orchestrate` to see real-time agent execution with:
- Live status updates
- Execution plans visualization
- Agent collaboration tracking

### Organization Tools
- **MeetingMate** (`/meetingmate`): Manage tasks, meetings, and schedules
- **RelationTrack** (`/relationtrack`): CRM for contacts and projects

### Admin Dashboard
Access `/admin` (admin users only) for:
- Platform analytics
- User management
- Cache performance metrics
- Private AI assistant

## 🔑 Key Concepts

### Agent Tools
Agents have access to various tools:
- `send_email`: Send emails via Resend
- `get_calendar`: Access calendar data
- `create_contact`: Add CRM contacts
- `add_research`: Store research findings
- `web_search`: Search the web (tier-based limits)

### Memory System
- Persistent memory across conversations
- Categorized storage (facts, preferences, goals)
- Automatic memory extraction from interactions

### Cost Optimization
- Smart agent routing to minimize API calls
- Cost-optimized model selection (gpt-4o-mini for most agents)
- Context window management (last 10 messages)
- Efficient caching system

## 📊 Performance

### Caching Strategy
| Data Type | TTL | Purpose |
|-----------|-----|---------|
| User Settings | 5 min | Frequent access |
| User Tiers | 10 min | Stable data |
| Messages | 2 min | High update frequency |
| Analytics | 1 min | Dynamic data |
| Daily Metrics | 5 min | Aggregations |

### Monitoring
- Real-time cache hit/miss ratios
- Agent execution time tracking
- Token usage and cost metrics
- Error logging with context

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

Built with Replit's powerful development platform and integrated services.

---

**Brought to you by Jesse L.**  
*Done different. 🐑*

**Made with ❤️ for autonomous AI learning**
