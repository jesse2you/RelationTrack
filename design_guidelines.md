# Personal CRM Design Guidelines

## Design Approach: Productivity-First Design System

**Selected Approach:** Design System (Linear + Notion hybrid)
- **Primary Inspiration:** Linear's minimalist productivity aesthetic
- **Secondary Reference:** Notion's organizational clarity and card patterns
- **Rationale:** Utility-focused CRM requiring data clarity, quick scanning, and efficient task management

**Core Principles:**
1. Information density without clutter
2. Instant visual status recognition (contact recency, overdue follow-ups)
3. Minimal friction for common actions (mark contacted, set reminders)
4. Professional appearance suitable for business relationships

---

## Color Palette

**Dark Mode (Primary):**
- Background: 220 13% 9% (deep charcoal)
- Surface: 220 13% 13% (elevated cards)
- Border: 220 9% 20% (subtle separators)
- Text Primary: 220 9% 98%
- Text Secondary: 220 9% 65%
- Accent: 210 90% 58% (professional blue for CTAs and active states)
- Success: 142 76% 36% (contacted recently)
- Warning: 38 92% 50% (due soon)
- Error: 0 84% 60% (overdue)

**Light Mode:**
- Background: 0 0% 100%
- Surface: 220 13% 98%
- Border: 220 13% 90%
- Text Primary: 220 13% 9%
- Text Secondary: 220 9% 45%

---

## Typography

**Font Family:** 
- Primary: 'Inter' via Google Fonts (system fallback: -apple-system, sans-serif)
- Monospace: 'JetBrains Mono' for dates/metadata

**Scale:**
- Hero/Empty States: text-2xl (24px), font-semibold
- Section Headers: text-lg (18px), font-semibold
- Card Titles (Contact Names): text-base (16px), font-medium
- Body/Metadata: text-sm (14px), font-normal
- Labels/Tags: text-xs (12px), font-medium, uppercase tracking-wide

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing: gap-2, p-2 (tags, inline elements)
- Component padding: p-4, p-6 (cards, forms)
- Section spacing: mb-8, py-12 (between major sections)
- Container margins: mx-4 mobile, mx-auto max-w-7xl desktop

**Grid Structure:**
- Dashboard: Single column mobile, 3-column grid desktop (sidebar 280px + main + quick actions 320px)
- Contact cards: Single column mobile, 2-column tablet, 3-column desktop
- Form layouts: Single column max-w-2xl centered

---

## Component Library

**Navigation:**
- Top bar: Fixed header with CRM title, "Add Contact" CTA, view toggles (All/Due Today)
- Left sidebar (desktop only): Tag filters with contact counts, collapsible
- Mobile: Bottom navigation sheet with filters

**Contact Cards:**
- Elevated surface with subtle shadow
- Status indicator: Left border (4px) - green (contacted <7 days), amber (7-30 days), red (>30 days or overdue)
- Header: Contact name, company subtitle (muted)
- Body: Last contacted date, next touch date (if set), tags as colored pills
- Actions: Quick "Contacted Today" button, edit/delete icons (subtle, appear on hover)
- Density: Compact but breathable - 24px padding, 12px gaps

**Tags:**
- Pill-shaped (rounded-full) with subtle background tints
- Work: blue 210 90% 58% at 10% opacity
- Personal: purple 270 65% 58% at 10% opacity  
- Networking: emerald 142 76% 36% at 10% opacity
- Custom tags: neutral gray tints
- Size: px-3 py-1, text-xs

**Forms (Add/Edit Contact):**
- Modal overlay: backdrop-blur-sm
- Form container: max-w-2xl, elevated card
- Input fields: Full-width with subtle borders, focus:ring accent color
- Date pickers: Calendar widget matching color scheme
- Tag selector: Multi-select chips with search
- Actions: Right-aligned, primary accent button + ghost cancel

**Due Today Dashboard:**
- Urgent card design: Warm amber accent left border
- Count badge: Prominent number with "contacts due today"
- Empty state: Friendly illustration placeholder with "All caught up!" message
- Quick mark complete: Checkbox-style interaction

**Data Visualization:**
- Contact recency timeline: Horizontal bar showing contact frequency distribution
- Tag usage: Simple bar chart (optional enhancement)

**Empty States:**
- Centered illustration area (240px square) with subtle icon
- Primary: "No contacts yet" with prominent "Add First Contact" CTA
- Filtered empty: "No contacts match filters" with clear filter reset

---

## Icons
- **Library:** Heroicons (outline for default, solid for active states) via CDN
- **Usage:** 20px for buttons, 16px for inline metadata, 24px for empty states

---

## Animations
**Minimal, purposeful only:**
- Card hover: subtle shadow increase (transition-shadow duration-200)
- Button interactions: scale-98 on active press
- Modal entry: fade + scale-95 to scale-100 (duration-200)
- NO scroll animations, parallax, or decorative motion

---

## Accessibility
- All interactive elements: min 44px touch target
- Focus indicators: 2px accent ring with offset
- Color never sole differentiator: Icons + text labels for all statuses
- Dark mode: WCAG AA contrast for all text (tested 4.5:1+)
- Keyboard navigation: Tab order follows visual hierarchy, Escape closes modals

---

## Images
**No hero image needed** - This is a utility application where information density takes priority. Use subtle background patterns or solid colors instead.

**Icon Illustrations:**
- Empty state: Minimal line-art person/contact icon (240x240px)
- Tutorial overlays: Simple iconography for feature explanations