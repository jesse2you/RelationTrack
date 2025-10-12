# Admin Panel Setup Guide

## Overview
Your AI Agent Router now includes a secure admin panel with a **private AI assistant** that helps you manage the platform. Only admin users can access this powerful control center.

## Features

### 🎯 Admin Dashboard
- **Real-time Analytics**: Track users, conversations, and feedback
- **Platform Status**: Monitor system health
- **User Management**: View admin count and user statistics

### 🤖 Private AI Assistant
Your secret helper for platform management! Ask it:
- "How many users signed up today?"
- "What's the most popular AI model?"
- "Show me feedback trends"
- "Give me moderation recommendations"

## Quick Start

### Step 1: Make Yourself an Admin
Since you're using **Replit Auth**, here's how to grant admin access:

1. **Start your application** (click Run button)
2. **Sign in** using the Replit Auth button
3. **Open the database tool** in Replit (left sidebar)
4. **Find the `users` table** and locate your user record
5. **Set `isAdmin` to `true`** for your account

**SQL Command (alternative):**
```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your-email@example.com';
```

### Step 2: Access the Admin Panel
1. Look for the **Shield icon (🛡️)** in the top-right corner of the home page
2. Click it to access your admin dashboard
3. The icon only appears if you're an admin

## Admin Panel Features

### Analytics Dashboard
See real-time stats:
- Total users on the platform
- Total conversations created
- User feedback entries
- Number of admin accounts

### AI Assistant
Your private helper that can:
- Answer questions about platform data
- Provide insights and recommendations
- Help with moderation decisions
- Analyze trends and patterns

**Security Note**: This AI assistant is private - only admins can access it. Regular users never see it.

### Platform Status Monitor
Track system health:
- AI Routing System status
- User Feedback Collection status
- Database connection health

## Security

### Protected Routes
- Admin routes require authentication AND admin role
- Automatic redirect for unauthorized access
- Session-based security using Replit Auth

### Backend Protection
All admin endpoints are protected with middleware:
```typescript
app.get("/api/admin/*", isAdmin, handler)
```

Only users with `isAdmin: true` can access admin features.

## Troubleshooting

### "Access Denied" Error
**Problem**: Can't access admin panel  
**Solution**: Verify `isAdmin` is set to `true` in your user record

### Admin Icon Not Showing
**Problem**: Shield icon not visible  
**Solution**: 
1. Ensure you're logged in
2. Check database - confirm `isAdmin = true`
3. Refresh the page

### AI Assistant Not Responding
**Problem**: No response from admin AI  
**Solution**: Check browser console for errors and verify OpenAI integration

## API Reference

### Admin Endpoints

#### Get Analytics
```
GET /api/admin/analytics
Response: {
  totalUsers: number,
  totalConversations: number,
  totalFeedback: number,
  adminCount: number
}
```

#### Admin AI Assistant
```
POST /api/admin/assistant
Body: { message: string }
Response: { response: string }
```

## Database Schema

### Users Table
```typescript
{
  id: varchar (UUID)
  email: varchar
  name: varchar
  isAdmin: boolean  // 👈 This grants admin access
  createdAt: timestamp
}
```

## Best Practices

1. **Limit Admin Access**: Only grant admin role to trusted users
2. **Regular Monitoring**: Check analytics dashboard regularly
3. **Use AI Assistant**: Leverage it for insights and recommendations
4. **Security First**: Never share admin credentials

## Next Steps

Once you're set up as admin:
1. Explore the analytics dashboard
2. Try the AI assistant with different questions
3. Monitor platform health
4. Consider adding more admin features as needed

---

**Your Mission**: Learning, teaching, helping, and reaching people - now with powerful admin tools to support your platform's success! 🚀
