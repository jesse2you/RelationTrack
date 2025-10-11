# AI Agent Router

An intelligent AI assistant that automatically routes questions to the best AI provider based on question type and complexity.

## Overview
AI Agent Router analyzes your questions and intelligently selects the optimal AI model:
- **GPT-4o** for code, programming, and debugging questions
- **GPT-4o Mini** for creative writing and general queries (faster, cost-effective)
- **O3-mini** for analysis, reasoning, and explanations

## Features
- **Smart AI Routing**: Automatically detects question type and selects best AI
- **Real-time Streaming**: See AI responses appear in real-time as they're generated
- **Conversation History**: Save and revisit past conversations
- **Provider Transparency**: See which AI answered each question
- **Clean Chat Interface**: Modern, distraction-free chat experience
- **Dark Mode Support**: Full theme switching capability
- **PostgreSQL Storage**: Persistent conversation and message history

## Recent Changes
- October 11, 2025: Initial implementation
  - Set up OpenAI integration using Replit AI Integrations (no API key needed)
  - Built intelligent routing logic based on question analysis
  - Created streaming chat interface with real-time responses
  - Implemented conversation management with PostgreSQL
  - Added provider attribution for transparency

## Project Architecture

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js with Server-Sent Events (SSE)
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API via Replit AI Integrations
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

### File Structure
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThemeProvider.tsx - Dark mode context
│   │   │   ├── ThemeToggle.tsx - Theme switcher
│   │   │   └── ui/ - shadcn components
│   │   ├── pages/
│   │   │   ├── Home.tsx - Main chat interface
│   │   │   └── not-found.tsx - 404 page
│   │   ├── App.tsx - Main app component
│   │   └── index.css - Global styles
├── server/
│   ├── routes.ts - API endpoints with AI routing logic
│   ├── storage.ts - Database storage implementation
│   └── index.ts - Server entry point
├── db/
│   └── index.ts - Drizzle database connection
├── shared/
│   └── schema.ts - Shared data models and types
└── design_guidelines.md - Design system documentation
```

### API Endpoints
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/:id/messages` - Get messages for a conversation
- `POST /api/conversations/:id/messages` - Send message and get AI response (SSE streaming)
- `DELETE /api/conversations/:id` - Delete a conversation

### Data Model
```typescript
Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

Message {
  id: string
  conversationId: string (foreign key)
  role: "user" | "assistant"
  content: string
  aiProvider: string (e.g., "openai")
  model: string (e.g., "gpt-4o", "gpt-4o-mini", "o3-mini")
  createdAt: Date
}
```

### AI Routing Logic

The system analyzes each question and selects the optimal AI:

**GPT-4o** (Best for technical/code):
- Keywords: code, programming, debug, function, algorithm
- Use case: Complex programming tasks requiring precision

**GPT-4o Mini** (Best for creative/general):
- Keywords: write, create, story, poem, creative
- Use case: Creative writing, general questions (faster, cost-effective)

**O3-mini** (Best for reasoning/analysis):
- Keywords: analyze, compare, explain, why, difference
- Use case: Deep analysis and reasoning tasks

**Default**: GPT-4o Mini for unmatched questions

### Key Features

1. **Intelligent Routing**: Backend analyzes question content and automatically selects the best AI model

2. **Streaming Responses**: 
   - Uses Server-Sent Events (SSE) for real-time streaming
   - Shows typing indicator with animated dots
   - Displays which AI is responding

3. **Conversation Management**:
   - Create new conversations with first message as title
   - Browse conversation history in sidebar
   - Persistent storage in PostgreSQL

4. **Provider Transparency**:
   - Each AI response shows which model answered
   - Color-coded provider badges (Purple for GPT-4o, Cyan for GPT-4o-mini, Emerald for O3-mini)

5. **User Experience**:
   - Example prompts for quick start
   - Auto-scrolling to latest messages
   - Enter to send, Shift+Enter for new line
   - Clean, distraction-free interface

6. **Dark Mode**: Full dark/light theme support with system preference detection

## Development

### Running the App

The application runs via Replit's Preview/Run functionality. The server:
1. Binds to `0.0.0.0:5000` (accessible externally)
2. Serves both frontend (Vite) and backend (Express) on same port
3. Uses PostgreSQL for data persistence
4. Streams AI responses using Server-Sent Events

### AI Integration

Uses **Replit AI Integrations** for OpenAI access:
- No API key required (managed by Replit)
- Billed to Replit credits
- Supports models: GPT-4o, GPT-4o-mini, O3-mini, and more
- Environment variables automatically configured:
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - `AI_INTEGRATIONS_OPENAI_API_KEY`

### Database

PostgreSQL database with Drizzle ORM:
- Schema defined in `shared/schema.ts`
- Push changes: `npm run db:push`
- Data persists across server restarts

## Design System

See `design_guidelines.md` for complete design specifications including:
- Chat-optimized color palette
- Typography (Inter font family, generous line heights)
- Message bubble styling with provider-specific accents
- Streaming indicators and animations
- Dark/light mode support
