# Group Chat Backend - Deployment & Testing Guide

## ✅ Backend Implementation Complete!

### What Was Built:

1. **Socket.IO Server** (`src/socket/socket.ts`)
   - Real-time WebSocket communication
   - Authentication middleware
   - Room management (join/leave)
   - Typing indicators
   - Read receipts

2. **Group Service** (`src/services/group.service.ts`)
   - User color assignment (13 colors)
   - Join/leave groups
   - Get available groups
   - Get group messages from join date
   - Pagination support

3. **Group Controller & Routes** 
   - `src/controllers/group.controller.ts`
   - `src/routes/group.routes.ts`
   - Full REST API for groups

4. **Server Integration**
   - Socket.IO initialized on server start
   - Group routes added to Express
   - Chat messages broadcast via Socket.IO

## 🚀 Deployment Steps

### Step 1: Build the Backend

```bash
cd /path/to/Lordmoon
npm run build
```

### Step 2: Create Sample Groups

```bash
node create-sample-groups.js
```

This creates 5 test groups:
- 🎮 Gaming Community
- 🛒 Marketplace Chat
- 💻 Tech Talk
- 💬 General Chat
- 📈 Crypto & Trading

### Step 3: Deploy to VPS

```bash
# SSH into VPS
ssh user@your-vps

# Navigate to project
cd /var/www/clanplug

# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Build
npm run build

# Restart server
pm2 restart lordmoon-backend
# OR
pm2 stop lordmoon-backend && pm2 start npm --name "lordmoon-backend" -- start
```

### Step 4: Verify Socket.IO is Running

Check server logs:
```bash
pm2 logs lordmoon-backend
```

You should see:
```
✅ Socket.IO initialized
```

## 🧪 Testing the Backend

### Test 1: Get Available Groups

```bash
curl -X GET https://api.clanplug.site/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "🎮 Gaming Community",
      "description": "...",
      "memberCount": 0,
      "isJoined": false
    }
  ]
}
```

### Test 2: Join a Group

```bash
curl -X POST https://api.clanplug.site/api/groups/GROUP_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Send a Message

```bash
curl -X POST https://api.clanplug.site/api/chats/GROUP_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello group!", "type": "TEXT"}'
```

### Test 4: Get Group Messages

```bash
curl -X GET https://api.clanplug.site/api/groups/GROUP_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📡 Socket.IO Connection

### Client Connection (for testing)

```javascript
import io from 'socket.io-client';

const socket = io('https://api.clanplug.site', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected!');
  
  // Join a chat room
  socket.emit('chat:join', 'CHAT_ID');
});

socket.on('message:new', (message) => {
  console.log('New message:', message);
});

socket.on('user:typing', ({ userId, isTyping }) => {
  console.log(`User ${userId} is ${isTyping ? 'typing' : 'stopped typing'}`);
});
```

## 📊 API Endpoints Summary

### Groups
- `GET /api/groups` - List all groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/join` - Join a group
- `POST /api/groups/:id/leave` - Leave a group
- `GET /api/groups/:id/messages` - Get group messages

### Messages (existing, now with Socket.IO)
- `POST /api/chats/:id/messages` - Send message (broadcasts via Socket.IO)
- `GET /api/chats/:id/messages` - Get messages

### Socket.IO Events
- `chat:join` - Join a chat room
- `chat:leave` - Leave a chat room
- `chat:typing` - Send typing indicator
- `chat:read` - Mark messages as read
- `message:new` - Receive new messages (from server)
- `user:typing` - Receive typing indicators (from server)
- `user:joined` - User joined notification (from server)

## 🔐 Security Notes

- All routes require authentication
- Socket.IO connections require valid JWT token
- Users can only see messages from their join date
- Users must be participants to access chat rooms

## ⚡ Performance

- Messages paginated (20 at a time)
- Socket.IO uses WebSocket (falls back to polling)
- User colors generated consistently (no DB overhead)
- Messages filtered by join date at query level

## 🐛 Troubleshooting

### Socket.IO not connecting:
- Check firewall allows WebSocket connections
- Verify CORS settings in `src/socket/socket.ts`
- Check token is valid

### Groups not showing:
- Run `create-sample-groups.js` script
- Check database connection
- Verify user is authenticated

### Messages not real-time:
- Check Socket.IO is initialized (server logs)
- Verify client is connected and joined room
- Check network tab for WebSocket connection

## ✅ Next Steps: Frontend Implementation

With backend complete, next session we'll implement:
1. Socket.IO client in Next.js
2. Update chat list to show groups
3. Group chat UI component
4. Real-time message updates
5. User color display

Backend is ready and waiting! 🚀
