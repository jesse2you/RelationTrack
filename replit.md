# Personal CRM

A lightweight personal CRM application for tracking contacts, managing follow-ups, and maintaining relationships.

## Overview
Personal CRM helps users track people they know with:
- Contact management (name, company, email, phone, notes)
- Last contact date tracking with visual indicators
- Next-touch reminders and follow-up scheduling
- Flexible tagging system (Work, Personal, Networking, etc.)
- "Due Today" dashboard view for contacts needing attention
- Clean, professional card-based interface with subtle color accents

## Recent Changes
- October 11, 2025: PostgreSQL Migration
  - Migrated from in-memory storage to PostgreSQL database
  - Created DbStorage class using Drizzle ORM
  - Database schema pushed and verified
  - Data now persists across server restarts

- October 11, 2025: Initial implementation
  - Created contact data schema with all fields
  - Built complete frontend with React, shadcn/ui components
  - Implemented backend with in-memory storage
  - Added dark mode support
  - Created responsive card-based layout with status indicators

## Project Architecture

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns

### File Structure
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThemeProvider.tsx - Dark mode context
│   │   │   ├── ThemeToggle.tsx - Theme switcher
│   │   │   ├── ContactCard.tsx - Contact display card
│   │   │   └── ContactDialog.tsx - Add/edit contact form
│   │   ├── pages/
│   │   │   ├── Home.tsx - Main dashboard
│   │   │   └── not-found.tsx - 404 page
│   │   ├── App.tsx - Main app component
│   │   └── index.css - Global styles
│   └── index.html
├── server/
│   ├── routes.ts - API endpoints
│   ├── storage.ts - Database storage implementation (DbStorage)
│   └── index.ts - Server entry point
├── db/
│   └── index.ts - Drizzle database connection
├── shared/
│   └── schema.ts - Shared data models and types
└── design_guidelines.md - Design system documentation
```

### API Endpoints
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create a new contact
- `GET /api/contacts/:id` - Get a specific contact
- `PATCH /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact
- `POST /api/contacts/:id/contacted` - Mark contact as contacted today

### Data Model
```typescript
Contact {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  notes?: string
  lastContactDate?: Date
  nextTouchDate?: Date
  tags: string[]
}
```

### Key Features
1. **Contact Cards**: Display with left border status indicators
   - Green: Contacted within 7 days
   - Amber: Contacted 7-30 days ago
   - Red: Not contacted in 30+ days

2. **Due Today View**: Filter contacts with follow-ups due today or overdue

3. **Tag System**: Flexible categorization with color-coded pills
   - Work (blue)
   - Personal (purple)
   - Networking (green)
   - Custom tags (gray)

4. **Quick Actions**:
   - "Contacted Today" button to update last contact date
   - Edit and delete contact options
   - Add new contact with comprehensive form

5. **Dark Mode**: Full dark/light theme support with system preference detection

## Development

### Running the App

**To start the application:**
1. Click the "Run" button at the top of the Replit interface, or
2. Run `npm run dev` in the shell

The application runs on port 5000 and serves both frontend and backend.

**Note:** The app now uses PostgreSQL for persistent storage. Data will be preserved across server restarts.

### Building for Production
```bash
npm run build
npm run start
```

## Design System
See `design_guidelines.md` for complete design specifications including:
- Color palette (professional blue accent theme)
- Typography (Inter font family)
- Component patterns
- Spacing and layout guidelines
- Accessibility standards
