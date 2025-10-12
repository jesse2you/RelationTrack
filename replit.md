# AI Agent Router - Single Unified Application

## What This Is
**ONE intelligent chat application** that automatically picks the best AI for your questions.

### How It Works (All in One App)
```
YOU ASK A QUESTION
    ↓
AI ROUTER (analyzes your question)
    ↓
PICKS BEST AI:
• GPT-4o → Code/Technical questions
• GPT-4o-mini → Creative/General questions  
• O3-mini → Analysis/Reasoning questions
    ↓
STREAMS RESPONSE BACK TO YOU
```

## Project Structure (ONE Application)

```
AI Agent Router/
├── client/              # Frontend - What you see
│   ├── src/pages/Home.tsx    # Main chat interface
│   └── src/components/       # UI components
│
├── server/              # Backend - AI routing logic
│   ├── routes.ts            # API endpoints
│   └── storage.ts           # Database operations
│
├── shared/schema.ts     # Data models used by both
└── db/                  # PostgreSQL database
```

**All parts run together as ONE unified app on port 5000**

## How to Run

1. Click the **Run** button at top of Replit
2. App starts on port 5000
3. Everything (frontend + backend + database) works together automatically

## Features

✅ **Smart AI Selection** - Automatically picks best AI for each question  
✅ **Real-time Streaming** - See responses as they're generated  
✅ **Conversation History** - All chats saved in database  
✅ **Provider Transparency** - Shows which AI answered (color-coded badges)  
🛡️ **Admin Panel** - Secure dashboard for platform management (admin-only)  
🤖 **Private AI Assistant** - Secret helper for admins to analyze data & get insights  

## Technology Stack (Single Unified App)

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Express.js + Node.js  
- **Database:** PostgreSQL (Replit built-in)
- **AI Integration:** OpenAI API (Replit AI Integrations - no API key needed)

## API Endpoints (All in Same App)

**Public Routes:**
- `GET /api/conversations` - List your chats
- `POST /api/conversations` - Start new chat
- `GET /api/conversations/:id/messages` - Get chat history
- `POST /api/conversations/:id/messages` - Send message & get AI response

**Admin Routes (Protected):**
- `GET /api/admin/analytics` - Platform analytics (users, conversations, feedback)
- `POST /api/admin/assistant` - Private AI assistant queries
- `POST /api/admin/users/:id/toggle-admin` - Toggle admin status

## Recent Updates

**October 12, 2025 (Latest):** Admin Panel & Private AI Assistant Added
- 🛡️ Secure admin authentication using Replit Auth
- 📊 Admin dashboard with real-time analytics
- 🤖 Private AI assistant for platform management
- 🔒 Role-based access control (isAdmin middleware)
- 📖 Complete setup documentation (ADMIN_SETUP.md)

**October 12, 2025:** All critical bugs fixed
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
  model: string (e.g., "gpt-4o")
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

---

**Bottom Line:** You have ONE powerful AI chat app that smartly routes questions to the best AI. Everything is consolidated and working together.
