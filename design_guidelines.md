# AI Agent Router Design Guidelines

## Design Approach: Chat-Optimized Design System

**Selected Approach:** Hybrid Design System (ChatGPT minimalism + Material Design structure)
- **Primary Inspiration:** ChatGPT's conversation-first clarity and clean message threading
- **Secondary Reference:** Linear's professional typography and subtle visual hierarchy
- **Rationale:** Utility-focused chat interface requiring message readability, clear AI provider differentiation, and seamless conversation flow

**Core Principles:**
1. Conversation clarity trumps visual decoration
2. Instant AI provider recognition through color + iconography
3. Optimized reading experience for long-form AI responses
4. Professional appearance suitable for business and technical users
5. Streaming response feedback without distraction

---

## Color Palette

**Dark Mode (Primary):**
- Background: 222 13% 8% (deep charcoal)
- Surface: 222 13% 12% (message container)
- Message Bubbles User: 222 13% 16% (elevated user messages)
- Message Bubbles AI: 222 13% 14% (AI response container)
- Border: 222 9% 20%
- Text Primary: 222 9% 98%
- Text Secondary: 222 9% 65%
- Accent: 210 100% 56% (primary CTAs, focus states)

**AI Provider Colors (vibrant, distinctive):**
- GPT-4o: 260 85% 65% (rich purple)
- GPT-4o-mini: 195 90% 55% (cyan blue)
- O3-mini: 160 75% 50% (emerald green)

**Status Colors:**
- Streaming: 210 100% 56% (pulsing blue)
- Success: 142 76% 36%
- Error: 0 84% 60%

**Light Mode:**
- Background: 0 0% 100%
- Surface: 222 13% 98%
- Message Bubbles User: 210 100% 96% (light blue tint)
- Message Bubbles AI: 0 0% 97% (soft gray)
- Text Primary: 222 13% 9%
- Text Secondary: 222 9% 45%

---

## Typography

**Font Family:** 
- Primary: 'Inter' via Google Fonts (optimized for screen reading)
- Code blocks: 'JetBrains Mono' for technical responses

**Scale:**
- Page Title: text-2xl (24px), font-semibold
- Message Content: text-base (16px), font-normal, leading-relaxed (1.75)
- Input Placeholder: text-base (16px), font-normal
- Metadata/Timestamps: text-xs (12px), font-medium
- Provider Labels: text-sm (14px), font-semibold
- Code: text-sm (14px), JetBrains Mono

**Line Height:** Generous spacing for readability - use leading-7 for message content, leading-relaxed for paragraphs

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24

**Core Structure:**
- Container: max-w-4xl centered (optimal reading width for AI responses)
- Message padding: p-6 for AI responses, p-4 for user messages
- Message spacing: space-y-6 between conversation turns
- Input area: p-4 with sticky bottom positioning
- Sidebar (conversation history): w-64 desktop, slide-in drawer mobile

**Grid:**
- Main chat: Single column, max-w-4xl
- Landing page: 2-column split (hero image left 55% + content right 45% on desktop)
- Message metadata: Flex row with justify-between

---

## Component Library

**Chat Messages:**
- **User Messages:** Right-aligned, max-w-3xl, rounded-2xl, bg surface elevated, subtle shadow
- **AI Messages:** Left-aligned, full-width max-w-4xl, rounded-2xl, provider-specific accent left border (4px)
- **Provider Badge:** Top-left of AI message - pill shape with provider icon + name, background using provider color at 12% opacity
- **Timestamp:** Below message, text-xs, muted secondary color
- **Message Avatar:** 32px circle for AI (provider-specific color gradient), 32px for user (neutral gradient)

**Streaming Indicator:**
- Pulsing ellipsis animation (three dots) in accent color
- Subtle glow effect around streaming message container
- Small "Thinking..." text with animated dots

**Input Area:**
- Sticky bottom, full-width with max-w-4xl inner container
- Multi-line textarea with auto-expand (max 200px height)
- Rounded-xl border with focus:ring accent
- Send button: Icon button (paper plane) with accent background, right-aligned inside input
- Character count: Bottom-right, text-xs when approaching limit
- Attachment button: Left-aligned icon for file uploads

**Conversation History Sidebar:**
- List of past conversations with timestamps
- Each item: Truncated first message preview (2 lines), hover highlight
- Active conversation: Accent left border (3px) + elevated background
- New chat button: Prominent at top with accent color
- Search conversations: Input with search icon at top of sidebar

**Provider Selection (if manual override):**
- Horizontal pill selector below input
- Three pills with provider icons + names
- Selected state: Full color background, unselected: outline with 10% opacity background

**Code Blocks in Messages:**
- Dark background (222 13% 10%), rounded-lg
- Syntax highlighting using standard code color scheme
- Copy button: Top-right corner, appears on hover
- Language label: Top-left, small badge

**Landing Page Hero:**
- Split layout: Left 55% high-quality image showing AI/technology visualization
- Right 45%: Headline + subheadline + primary CTA button
- Image: Abstract neural network visualization, gradient overlay (purple to cyan matching provider colors)
- Headline: text-5xl, font-bold, gradient text effect
- CTA: Large accent button "Start Chatting" with arrow icon

**Empty State (No Messages):**
- Centered in chat area
- AI router icon (240px, gradient using provider colors)
- Welcoming headline: "Ask me anything"
- Example prompts: 3 suggestion cards with light backgrounds, hover lift effect
- Each card shows sample question with subtle border

---

## Icons

**Library:** Heroicons (outline) via CDN
**Key Icons:**
- Send: paper-airplane (solid when active)
- New chat: plus-circle
- Menu/sidebar toggle: bars-3
- Search: magnifying-glass
- Provider icons: Custom colored badges (sparkle for GPT-4o, lightning for mini models)
**Sizes:** 20px buttons, 16px inline metadata, 24px provider badges

---

## Images

**Landing Page Hero Image:**
- **Placement:** Left side of split hero section (55% width desktop, full-width mobile above content)
- **Description:** Modern abstract visualization of AI neural networks with flowing data connections, gradient overlay transitioning from purple to cyan to emerald (matching provider colors), professional and technological aesthetic
- **Treatment:** Subtle blur effect on edges, 8px rounded corners
- **Size:** 1200x800px minimum, responsive scaling

**No additional images needed** for main chat interface - focus remains on conversation content

---

## Animations

**Purposeful Only:**
- Message entry: Fade + slide-up (duration-300, ease-out)
- Streaming dots: Gentle bounce animation (stagger each dot)
- Button hover: Subtle scale-105 (duration-200)
- Sidebar slide: translate-x transition (duration-300)
- Provider badge pulse: Gentle glow on message arrival
- NO scroll animations or parallax

---

## Accessibility

- Message contrast: WCAG AAA for body text (7:1)
- Provider colors: Never sole indicator - always paired with icon + text label
- Keyboard shortcuts: Cmd+K new chat, Cmd+/ focus input, arrow keys navigate history
- Screen reader: Announce new messages, provider attribution, streaming status
- Focus indicators: 2px accent ring on all interactive elements
- Touch targets: Minimum 44px for all buttons

---

## Message Threading & Flow

- Clear visual separation between conversation turns using consistent spacing (space-y-6)
- Provider attribution always visible at message start
- Long AI responses: Maintain max-w-4xl for optimal reading, never full viewport width
- Code blocks: Distinct background, proper syntax highlighting
- Markdown support: Headers, lists, bold, italic, links styled consistently
- Loading state: Skeleton screens for message placeholders during streaming