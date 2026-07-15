# Frontend Group Chat Setup Guide

## 📦 Step 1: Install Socket.IO Client

```bash
cd web
npm install socket.io-client
```

## ✅ What's Been Created:

### 1. Socket.IO Context
**File:** `web/src/contexts/SocketContext.tsx`

This provides:
- Automatic Socket.IO connection with JWT auth
- `useSocket()` hook for components
- Connection state management
- Helper functions: `joinChat`, `leaveChat`, `sendTyping`, `markAsRead`

## 🔧 Step 2: Integrate Socket Provider

Update `web/src/app/layout.tsx` to wrap the app with SocketProvider:

```typescript
import { SocketProvider } from '@/contexts/SocketContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## 📋 Step 3: Create Group API Service

**File:** `web/src/services/group.service.ts`

```typescript
export const groupService = {
  async getGroups() {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async joinGroup(chatId: string) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${chatId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async getGroupMessages(chatId: string, page = 1) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${chatId}/messages?page=${page}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    return response.json();
  },

  async sendMessage(chatId: string, content: string) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chats/${chatId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, type: 'TEXT' })
      }
    );
    return response.json();
  },
};
```

## 🎨 Step 4: Update Chat Page

The chat page needs to:
1. Detect if chat is a GROUP type
2. Show group UI with colors
3. Listen for real-time messages
4. Display user names with colors

Key changes needed in `web/src/app/chat/page.tsx`:
- Check `chat.type === 'GROUP'`
- Join socket room when opening group
- Listen to `message:new` event
- Display username above each message
- Apply user color to name and bubble

## 🚀 Step 5: Add Group Discovery UI

Create a button/modal to show available groups and join them.

## 📊 Implementation Priority:

1. ✅ Socket.IO Context (DONE)
2. ⏳ Install socket.io-client
3. ⏳ Add SocketProvider to layout
4. ⏳ Create group service
5. ⏳ Update chat page for groups
6. ⏳ Add group discovery UI

## 🧪 Testing:

Once implemented:
1. Open chat page
2. Console should show: "✅ Socket.IO connected"
3. Join a group via API/backend
4. Group should appear in chat list
5. Open group chat
6. Send message → should appear instantly
7. Open in another browser → message should appear there too

## 📝 Next Steps:

Due to context limits, I've provided:
- ✅ Complete backend (ready to deploy)
- ✅ Socket.IO context
- ✅ Setup guide

To finish frontend, you need to:
1. Install socket.io-client
2. Add SocketProvider to layout
3. Create group service file
4. Update chat page to handle groups
5. Add group discovery UI

The backend is ready and waiting. When you deploy it and install socket.io-client, the real-time infrastructure will work immediately!

## 💡 Quick Win:

You can test the backend right now with curl/Postman while we finish the UI in the next session!
