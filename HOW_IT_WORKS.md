# How Your AI Agent Router Works 🧠

## The Big Picture

Your app is like a **smart receptionist** that routes customer questions to the right expert:

```
USER ASKS QUESTION
    ↓
ROUTER ANALYZES IT (looks for keywords)
    ↓
PICKS BEST AI:
  • "code", "function" → GPT-4o (best at programming)
  • "write", "poem" → GPT-4o-mini (creative & fast)
  • "analyze", "why" → O3-mini (deep reasoning)
    ↓
STREAMS ANSWER BACK
    ↓
SAVES TO DATABASE
```

---

## Step-by-Step: What Happens When You Send a Message

### 1. **You Type and Send** (Frontend)
```
Location: client/src/pages/Home.tsx
- Input field captures your text
- Sends to: POST /api/conversations/:id/messages
```

### 2. **Router Analyzes Your Question** (Backend)
```
Location: server/routes.ts - selectAIProvider()

The router looks for keywords:
- "code", "programming", "debug", "function" → GPT-4o
- "write", "create", "story", "poem" → GPT-4o-mini  
- "analyze", "compare", "explain", "why" → O3-mini
- Everything else → GPT-4o-mini (default)
```

**Example:**
- "Write a Python function" → contains "write" AND "function"
- Router sees "function" first → picks **GPT-4o** (code specialist)

### 3. **Gets Conversation History** (Database)
```
Location: server/storage.ts

Pulls all previous messages from PostgreSQL
Sends them to AI for context
So AI remembers your conversation!
```

### 4. **Streams AI Response** (Real-time)
```
Technology: Server-Sent Events (SSE)

Instead of waiting for full response:
- AI sends chunks as it thinks
- You see words appear in real-time
- Shows provider badge during streaming
```

### 5. **Saves Everything** (Database)
```
Tables: conversations, messages

Your message → saved
AI response → saved
Provider used → saved
So you can come back later!
```

---

## The AI Routing Logic (Current)

### GPT-4o (Purple Badge) 💜
**Best for:** Code, technical, programming
**Triggers:** "code", "programming", "debug", "function"
**Why:** Most powerful coding model

### GPT-4o-mini (Cyan Badge) 🩵  
**Best for:** Creative, general chat
**Triggers:** "write", "create", "story", "poem", OR anything else
**Why:** Fast, cheap, great for everyday tasks

### O3-mini (Emerald Badge) 💚
**Best for:** Deep analysis, reasoning
**Triggers:** "analyze", "compare", "explain", "why"
**Why:** Optimized for logical reasoning

---

## Architecture (How Files Connect)

```
shared/schema.ts        → Data models (what a conversation/message looks like)
    ↓
server/storage.ts       → Database operations (CRUD)
    ↓  
server/routes.ts        → API endpoints + AI routing logic
    ↓
client/src/pages/Home.tsx → Chat interface (what you see)
```

**They're all ONE app** running on port 5000!

---

## How to Make It Better

### Current Limitations:
1. **Fixed Keywords** - Only looks for specific words
2. **No User Control** - Can't change which AI handles what
3. **Basic Routing** - Doesn't learn from usage
4. **No Customization** - Users can't adjust settings

### What We'll Add Next:
1. **Smart Routing** - AI analyzes question intelligently (not just keywords)
2. **User Controls** - Let users pick models, adjust routing
3. **Custom Rules** - "Always use GPT-4o for my coding homework"
4. **Learning Mode** - Users help teach the router
5. **Theme Customization** - Design their own look

---

## Key Technologies

- **React** - Frontend UI (what you see)
- **Express** - Backend server (handles requests)
- **PostgreSQL** - Database (stores everything)
- **OpenAI API** - The actual AI models
- **Server-Sent Events** - Real-time streaming
- **TypeScript** - Type safety (fewer bugs)

---

## Making It Public-Ready

### What's Needed:
1. ✅ Working app (DONE!)
2. ⏳ User customization (ADDING NOW)
3. ⏳ Help/tutorial system
4. ⏳ User feedback mechanism
5. ⏳ Performance optimization
6. ⏳ Analytics to track usage

---

**Next Step:** Adding user customization panel so people can design, modify, and teach the router!
