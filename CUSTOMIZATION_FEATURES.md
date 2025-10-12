# AI Agent Router - Customization Features

## 🎨 New Features Overview

The AI Agent Router now includes powerful customization features that transform it into a collaborative learning tool where users can:

1. **Customize AI Preferences** - Choose preferred models and create custom routing rules
2. **Provide Feedback** - Help improve the system through thumbs up/down and suggestions
3. **Personalize Experience** - Configure help tips and learning preferences

---

## ✨ Feature Details

### 1. Settings Panel

**Access:** Click the ⚙️ settings icon in the top-right header

The settings dialog has 3 tabs:

#### **Models Tab**
- **Preferred AI Model**: Override automatic selection
  - Auto-select (recommended) - Smart routing based on question type
  - GPT-4o - Best for code, programming, debugging
  - GPT-4o-mini - Fast, creative, general chat
  - O3-mini - Deep reasoning, analysis, explanations
- **Model Guide**: Visual reference showing each AI's strengths

#### **Routing Rules Tab** (Advanced)
- **Custom Keywords**: Define your own routing logic using JSON
- Example:
  ```json
  {
    "keywords": {
      "homework": "gpt-4o",
      "essay": "gpt-4o-mini",
      "research": "o3-mini"
    }
  }
  ```
- **Routing Priority**:
  1. Custom keywords (highest)
  2. Built-in keyword detection
  3. Preferred model fallback
  4. Auto-select (default)

#### **Help & Tips Tab**
- **Show Help Tips**: Toggle tutorial hints
- **Learning Resources**: Links to documentation
- **Contribution Info**: How feedback improves the system

### 2. Message Feedback System

**Location:** Below every AI response

#### Quick Feedback
- 👍 Thumbs Up - Good response from the right AI
- 👎 Thumbs Down - Opens suggestion form

#### Detailed Feedback
When you click thumbs down:
1. Optional text feedback: "What could be better?"
2. Suggest alternative AI model (GPT-4o, GPT-4o-mini, O3-mini)
3. Submit to help train the router

---

## 🗄️ Database Schema

### New Tables

#### `user_settings`
```typescript
{
  id: string (UUID)
  userId: string (default: 'default_user')
  preferredModel: string | null
  customRouting: string | null (JSON)
  themePreference: string (default: 'system')
  showHelpTips: string (default: 'true')
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `user_feedback`
```typescript
{
  id: string (UUID)
  messageId: string (references messages.id)
  feedbackType: string ('thumbs_up' | 'thumbs_down' | 'suggestion')
  content: string | null
  suggestedModel: string | null
  createdAt: timestamp
}
```

---

## 🔌 API Endpoints

### Settings
- `GET /api/settings` - Fetch user settings
- `POST /api/settings` - Create/update settings

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/:messageId` - Get feedback for message

---

## 🧪 Testing Instructions

### 1. Settings Panel Test
```bash
# Open app in browser
1. Click ⚙️ Settings icon (top-right)
2. Go to Models tab
3. Select "GPT-4o" as preferred model
4. Click "Save Settings"
5. Close dialog

# Verify: All questions now route to GPT-4o
```

### 2. Custom Routing Test
```bash
# In Settings > Routing Rules tab
1. Enter JSON:
{
  "keywords": {
    "homework": "gpt-4o-mini"
  }
}
2. Save settings
3. Ask: "Help me with homework"
4. Verify: Routes to GPT-4o-mini (cyan badge)
```

### 3. Feedback System Test
```bash
# After any AI response
1. Click 👍 (Thumbs Up)
   - See toast: "Thanks for your feedback!"
2. Click 👎 (Thumbs Down)
   - Feedback form appears
3. Enter optional comment
4. Select suggested model
5. Click Submit
   - Form closes
   - Toast confirmation appears
```

### 4. Integration Test
```bash
# Full workflow
1. Set preferred model to GPT-4o
2. Add custom rule: "story" → "gpt-4o-mini"
3. Ask: "Write a story about robots"
4. Verify: Routes to GPT-4o-mini (overrides preference)
5. Give thumbs up
6. Check conversation persists correctly
```

---

## 🎯 User Benefits

### Learning & Teaching
- **Students**: Customize AI routing for different subjects
- **Teachers**: Provide feedback to improve educational responses
- **Developers**: Set code-focused defaults

### Customization
- **Power Users**: Create advanced routing rules
- **Beginners**: Use simple preferred model selection
- **Everyone**: Toggle help tips based on experience

### Collaboration
- **Feedback Loop**: User input improves AI selection
- **Transparency**: See which AI answered (color-coded badges)
- **Data Collection**: System learns from suggestions

---

## 🚀 How to Start

1. **Click the Run button** at the top of Replit
2. **Wait for server** to start on port 5000
3. **Open the webview** or visit the URL
4. **Click ⚙️** to access Settings
5. **Customize** your experience!

---

## 📝 Implementation Details

### Components Created
- `SettingsDialog.tsx` - Main customization interface
- `MessageFeedback.tsx` - Feedback collection widget

### Backend Updates
- Settings API endpoints (GET/POST)
- Feedback API endpoints (POST/GET)
- Database storage methods

### Frontend Updates
- Settings button in header
- Feedback widgets on messages
- State management for dialogs

---

## 🐛 Troubleshooting

**Settings won't save:**
- Check browser console for errors
- Verify database is connected
- Ensure API endpoints are accessible

**Feedback not submitting:**
- Check message ID exists
- Verify API endpoint is responding
- Look for validation errors

**Routing not working:**
- Custom rules must be valid JSON
- Keywords are case-insensitive
- Check routing priority order

---

## 🎉 What's Next

Future enhancements could include:
- Multi-user support with authentication
- Analytics dashboard showing AI usage patterns
- Community-contributed routing rules
- A/B testing different AI models
- Export/import settings

---

**Built with**: React, TypeScript, Express, PostgreSQL, OpenAI API
**Status**: ✅ Implementation Complete - Ready to Test!
