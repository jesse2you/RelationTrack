# Qwenticinicial - Multi-Agent AI Orchestration Platform

## What This Is
**ONE unified multi-agent platform** merging PhoneSyncGo, MeetingMate, A1AgentQuery, and RelationTrack into **Qwenticinicial** - your AI army to help with learning, organization, and on-the-go productivity.

### How It Works (Multi-Agent Coordination)
```
YOU ASK A QUESTION
    ↓
SMART ROUTING (keyword analysis)
    ↓
SELECTS BEST SPECIALIZED AGENT:
• Learning Coach (GPT-4o) → Learning guidance
• Teaching Assistant (GPT-4o-mini) → Content creation
• Research Agent (O3-mini) → Analysis & insights
• Task Manager (GPT-4o-mini) → Project organization
• Head Coordinator (GPT-4o-mini) → General queries
    ↓
STREAMS RESPONSE BACK TO YOU
```

## Project Structure (ONE Application)

```
AI Learning Hub/
├── client/              # Frontend - Mobile-responsive UI
│   ├── src/pages/Home.tsx    # Main chat interface
│   ├── src/pages/Admin.tsx   # Admin dashboard
│   └── src/components/       # UI components
│
├── server/              # Backend - Multi-agent coordination
│   ├── agentCoordinator.ts  # Agent routing & orchestration
│   ├── routes.ts            # API endpoints
│   └── storage.ts           # Database operations
│
├── shared/schema.ts     # Data models (multi-agent fields)
└── db/                  # PostgreSQL database
```

**All parts run together as ONE unified app on port 5000**

## How to Run

1. Click the **Run** button at top of Replit
2. App starts on port 5000
3. Everything (frontend + backend + database) works together automatically

## Features

✅ **Purple Gradient Interface** - Signature Qwenticinicial purple/pink/cyan gradient with frosted glass effects  
✅ **Voice Control** - Speech-to-text input and text-to-speech responses using Web Speech API  
✅ **Multi-Agent Coordination** - 5 specialized AI agents working as a team  
✅ **Smart Agent Routing** - Keyword-based scoring picks best agent for each task  
✅ **Cost-Optimized** - Designed to stay within $10-20/month target  
✅ **Mobile-Responsive** - Full mobile support with collapsible sidebar (PhoneSyncGo)  
✅ **MeetingMate Organization** - Tasks, meetings, and schedules management  
✅ **Real-time Streaming** - See AI responses as they're generated  
✅ **Conversation History** - All chats saved in database  
✅ **Agent Transparency** - See which agent responded with model badges  
🛡️ **Admin Panel** - Secure dashboard for platform management (admin-only)  
🤖 **Private AI Assistant** - Secret helper for admins to analyze data & get insights  

## Specialized Agents

### 1. Learning Coach (GPT-4o)
**Purpose:** Help you learn and understand new concepts  
**Keywords:** learn, study, understand, explain, how does, teach me  
**Model:** gpt-4o (higher quality for learning guidance)

### 2. Teaching Assistant (GPT-4o-mini)
**Purpose:** Create tutorials, lessons, and educational content  
**Keywords:** create lesson, tutorial, guide, course, curriculum, teach  
**Model:** gpt-4o-mini (cost-effective for content creation)

### 3. Research Agent (O3-mini)
**Purpose:** Analyze information, compare options, provide insights  
**Keywords:** analyze, compare, research, why, investigate, find out, study  
**Model:** o3-mini (specialized reasoning at reasonable cost)

### 4. Task Manager (GPT-4o-mini)
**Purpose:** Organize projects, create task lists, plan workflows  
**Keywords:** organize, plan, todo, task, project, manage, schedule  
**Model:** gpt-4o-mini (simple task organization)

### 5. Head Coordinator (GPT-4o-mini)
**Purpose:** Handle general queries and coordination  
**Keywords:** Fallback for queries not matching specialized agents  
**Model:** gpt-4o-mini (cheapest option for general queries)

## Cost Optimization Strategy

**Target:** $10-20/month to help as many people as possible affordably

**Optimizations Implemented:**

1. **Smart Agent Routing**
   - Keyword-based scoring finds best matching agent
   - Direct specialist selection (no coordinator → specialist delegation)
   - Single API call per user message
   - Coordinator only used as fallback

2. **Cost-Optimized Model Selection**
   - Most agents use gpt-4o-mini (cheapest)
   - Learning Coach uses gpt-4o (higher quality where it matters)
   - Research Agent uses o3-mini (specialized reasoning)
   - Typical query: $0.0001-0.0003 per request

3. **Context Window Management**
   - Limits conversation context to last 10 messages (5 turns)
   - Reduces token usage by 40-60% in long conversations
   - Maintains conversation coherence
   - Prevents exponential token growth

4. **Efficient Architecture**
   - No multi-hop agent delegation
   - Minimal overhead per request
   - Streaming responses (no unnecessary waiting)

## Mobile Support

**Responsive Design Features:**
- Collapsible sidebar on mobile (< 1024px)
- Hamburger menu toggle
- Touch-friendly controls (50px+ touch targets)
- Optimized text sizes for small screens
- Proper spacing across all breakpoints
- Full-screen chat on mobile devices

**Breakpoints:**
- Mobile: < 1024px (lg breakpoint)
- Tablet: 768px - 1023px
- Desktop: >= 1024px

## Technology Stack (Single Unified App)

- **Frontend:** React + TypeScript + Tailwind CSS + Lucide Icons
- **Backend:** Express.js + Node.js + Multi-Agent Coordinator
- **Database:** PostgreSQL (Replit built-in)
- **AI Integration:** OpenAI API (Replit AI Integrations - no API key needed)
- **Authentication:** Replit Auth with session management

## API Endpoints (All in Same App)

**Public Routes:**
- `GET /api/conversations` - List your chats
- `POST /api/conversations` - Start new chat
- `GET /api/conversations/:id/messages` - Get chat history
- `POST /api/conversations/:id/messages` - Send message & get AI response (SSE streaming)

**Admin Routes (Protected):**
- `GET /api/admin/analytics` - Platform analytics (users, conversations, feedback)
- `POST /api/admin/assistant` - Private AI assistant queries
- `POST /api/admin/users/:id/toggle-admin` - Toggle admin status

## Recent Updates

**October 12, 2025 (Latest):** Multi-Agent System & Mobile Support
- 🤖 **Multi-agent orchestration** with 5 specialized AI agents
- 🎯 **Smart keyword-based routing** for cost-efficient agent selection
- 💰 **Cost optimization** strategies targeting $10-20/month
- 📱 **Mobile-responsive UI** with collapsible sidebar
- 🎨 **Lucide-react icons** for agent badges (Brain, GraduationCap, BookOpen, Search, CheckSquare)
- ⚡ **Context window management** to reduce token usage
- 🎯 **Single API call per message** (no double delegation)

**October 12, 2025:** Admin Panel & Private AI Assistant
- 🛡️ Secure admin authentication using Replit Auth
- 📊 Admin dashboard with real-time analytics
- 🤖 Private AI assistant for platform management
- 🔒 Role-based access control (isAdmin middleware)

**October 12, 2025:** Critical Bug Fixes
- ✅ SSE error handling 
- ✅ "New Chat" flow working
- ✅ Provider attribution during streaming
- ✅ Smooth message transitions
- ✅ Comprehensive error handling

## Database Schema

```typescript
conversations {
  id: string
  title: string
  createdAt: timestamp
  updatedAt: timestamp
}

messages {
  id: string
  conversationId: string (links to conversation)
  role: "user" | "assistant"
  content: text
  aiProvider: string (e.g., "openai")
  model: string (e.g., "gpt-4o", "gpt-4o-mini", "o3-mini")
  agentName: string (e.g., "Learning Coach")
  agentRole: string (e.g., "learning_coach")
  taskType: string (e.g., "learning", "teaching", "research", "planning", "general")
  createdAt: timestamp
}

users {
  id: varchar (UUID)
  email: varchar
  firstName: varchar
  lastName: varchar
  profileImageUrl: varchar
  isAdmin: boolean (grants admin access)
  createdAt: timestamp
}

sessions {
  sid: varchar (session ID)
  sess: json (session data)
  expire: timestamp
}

userFeedback {
  id: serial
  messageId: string (links to message)
  rating: string ("positive" | "negative")
  suggestion: text
  createdAt: timestamp
}
```

## Important Notes

- **This is ONE application** - Frontend, backend, and database all work together
- **No API key needed** - Uses Replit AI Integrations (billed to your Replit credits)
- **Cost-optimized design** - Targeting $10-20/month to help as many people as possible
- **Mobile-first approach** - Full support for phones and tablets
- **Dark mode supported** - Full theme switching
- **All data persists** - Conversations saved in PostgreSQL
- **Admin Access** - See ADMIN_SETUP.md for instructions on enabling admin features
- **Secure Authentication** - Uses Replit Auth with session management

## Troubleshooting

**If app won't start:**
1. Click the Run button (not npm commands)
2. Check Console pane for errors
3. Ensure port 5000 is available

**If getting 502 errors:**
- App needs to be started via Run button for external access
- Local terminal commands won't expose it properly

**Admin Access Issues:**
- Ensure you're logged in via Replit Auth
- Check database: verify `isAdmin = true` for your user
- See ADMIN_SETUP.md for detailed instructions

**Mobile Testing:**
- Test on actual mobile device or browser DevTools
- Ensure sidebar toggles properly
- Verify touch targets are easily clickable

---

**Bottom Line:** You have ONE powerful AI Learning Hub with a team of specialized AI agents that intelligently route your requests, stay affordable, and work beautifully on any device.
