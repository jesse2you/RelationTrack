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
- October 11, 2025: Dashboard Analytics & Quick Actions
  - Added analytics dashboard with 4 stat cards (total contacts, recent activity, due today, overdue)
  - Implemented Recent Activity Feed in sidebar showing latest interactions across all contacts
  - Built Quick Add dialog for faster contact creation with minimal fields (name, company, email)
  - Activity feed auto-refreshes every 30 seconds and updates on all mutations
  - Analytics use precise date calculations (< 7 days for recent contacts)
  - Quick Add reuses existing mutation pipeline and closes properly on success

- October 11, 2025: Bulk Operations & Advanced Features
  - Added contact selection with checkboxes and visual feedback (ring highlight)
  - Implemented bulk delete with confirmation dialog
  - Added bulk export for selected contacts (CSV and JSON)
  - Built sticky bulk actions toolbar that appears when contacts are selected
  - Select all/deselect all functionality
  - Selection state properly cleared after operations

- October 11, 2025: Advanced Sorting
  - Added sorting by name, company, last contact date, and next touch date
  - Implemented ascending/descending toggle with visual indicators
  - Sort dropdown in sidebar with clear UI feedback
  - Proper handling of null/empty values in sorting
  - Works seamlessly with filters and search

- October 11, 2025: Contact Import
  - Built CSV and JSON import functionality with file upload
  - Robust CSV parser handles CRLF, quoted fields, and escaped quotes
  - Date validation and normalization for optional date fields
  - Import results dialog shows success/failure counts with error details
  - Automatic activity logging for imported contacts
  - Proper cache invalidation after import

- October 11, 2025: Activity Timeline & Data Export
  - Added activity history tracking (created, updated, contacted events)
  - Built ActivityTimeline component with visual timeline display
  - Implemented CSV and JSON export functionality with proper file downloads
  - Added export dropdown menu to header with format selection
  - Activity logging automatically tracks all contact interactions
  - Timeline auto-refreshes after new activities via proper cache invalidation

- October 11, 2025: Contact Search Implementation
  - Added search input with real-time filtering
  - Backend search across all fields (name, company, email, phone, notes, tags)
  - Proper cache invalidation for search results
  - Search state management with clear functionality

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
│   │   │   ├── ContactCard.tsx - Contact display card with selection
│   │   │   ├── ContactDialog.tsx - Add/edit contact form
│   │   │   ├── QuickAddDialog.tsx - Quick add contact with minimal fields
│   │   │   ├── ActivityTimeline.tsx - Activity history timeline
│   │   │   └── ImportDialog.tsx - CSV/JSON import dialog
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
- `GET /api/contacts/search?q={query}` - Search contacts across all fields
- `POST /api/contacts` - Create a new contact
- `POST /api/contacts/import` - Import contacts from CSV or JSON
- `GET /api/contacts/:id` - Get a specific contact
- `PATCH /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact
- `POST /api/contacts/:id/contacted` - Mark contact as contacted today
- `GET /api/contacts/:id/activities` - Get activity timeline for a contact
- `GET /api/activities/recent?limit={number}` - Get recent activities across all contacts (default 10)
- `GET /api/contacts/export/csv` - Export all contacts as CSV file
- `GET /api/contacts/export/json` - Export all contacts as JSON file

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

Activity {
  id: string
  contactId: string (foreign key)
  type: "created" | "update" | "contact" | string
  description: string
  notes?: string
  createdAt: Date
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
   - View activity timeline with interaction history

5. **Search & Filter**: Real-time search across all contact fields with tag filtering

6. **Activity Timeline**: 
   - Automatic logging of all contact interactions
   - Visual timeline with icons for different activity types
   - Timestamp display with relative time formatting
   - Accessible via timeline button on contact cards

7. **Advanced Sorting**:
   - Sort contacts by name, company, last contact date, or next touch date
   - Toggle between ascending and descending order
   - Visual indicators for current sort field and direction
   - Proper handling of null/empty values

8. **Data Import/Export**:
   - Import contacts from CSV or JSON files with validation
   - Export all contacts as CSV with proper formatting
   - Export all contacts as JSON with pretty printing
   - Export selected contacts (bulk export)
   - Automatic file download with timestamped filenames

9. **Bulk Operations**:
   - Select multiple contacts with checkboxes
   - Bulk delete with confirmation dialog
   - Bulk export selected contacts (CSV/JSON)
   - Select all/deselect all functionality
   - Visual feedback with ring highlight on selected contacts

10. **Dashboard Analytics**:
   - Total contacts count
   - Recent activity (contacted in last 7 days with strict < 7 day calculation)
   - Due today (follow-ups scheduled for today)
   - Overdue (follow-ups past due date)
   - Visual stat cards with color-coded metrics using chart colors

11. **Recent Activity Feed**:
   - Sidebar feed showing latest interactions across all contacts
   - Displays contact name, activity description, and relative timestamps
   - Auto-refreshes every 30 seconds
   - Scrollable feed with max height constraint
   - Updates immediately on contact create/update/mark contacted

12. **Quick Add**:
   - Streamlined contact creation with minimal fields (name, company, email)
   - Quick Add button in header for fast access
   - Auto-focus on name field for immediate entry
   - Reuses existing mutation pipeline for consistency
   - Dialog closes automatically on successful submission

13. **Dark Mode**: Full dark/light theme support with system preference detection

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
