# Group Chat Implementation Plan

## Overview
Implement WhatsApp-like group chat functionality with real-time messaging, user color coding, and efficient data usage.

## Current Status
✅ Database schema already supports:
- Chat types (DIRECT, GROUP)
- Chat participants with roles
- Message types (TEXT, IMAGE, VIDEO, AUDIO, FILE)
- Message threading and replies
- Participant join dates (for showing messages from join time)

## Features to Implement

### 1. Backend Requirements

#### A. Group Management Endpoints
- `POST /api/groups` - Create a new group (future feature - add + icon)
- `POST /api/groups/:id/join` - Join a group
- `GET /api/groups` - List available groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/leave` - Leave a group

#### B. Real-time Messaging
- Use Socket.IO for real-time updates
- Events:
  - `group:message` - New message in group
  - `group:user_joined` - User joined group
  - `group:user_left` - User left group
  - `group:typing` - User typing indicator

#### C. Message History
- Only show messages from when user joined (WhatsApp style)
- Pagination for older messages (20 messages at a time)
- Efficient queries with proper indexing

#### D. User Color Assignment
- Assign each user a unique color in each group
- Store in ChatParticipant metadata or create UserColor model
- Colors: 10-15 predefined colors for readability

### 2. Frontend Requirements

#### A. Group Discovery
- Add "+ Groups" button in chat list
- Modal/page showing available groups
- Join button for each group
- Show member count

#### B. Chat List Integration
- Group chats appear in main chat list
- Show group avatar/icon
- Show last message preview
- Unread message counter (red badge)
- Sort by most recent activity

#### C. Group Chat Interface (WhatsApp-like)
**Header:**
- Group name
- Member count (e.g., "125 members")
- Group info button → shows member list
- Back button

**Messages:**
- User name above each message (if different from previous)
- User-specific color for name and bubble
- Timestamp on hover/press
- Text messages
- Emoji support (native)
- Image messages (compressed)
- Click on name/avatar → view user profile

**Input:**
- Text input with emoji picker
- Image upload button (📷 icon)
- Send button
- No video/audio/files (keep it light)

**Real-time:**
- Messages appear instantly without refresh
- Typing indicators ("John is typing...")
- Message delivery status (optional)

#### D. User Colors
- Generate from predefined palette:
  ```javascript
  const USER_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B195', // Peach
    '#C06C84', // Rose
    '#6C5B7B', // Plum
    '#355C7D', // Navy
    '#2ECC71', // Green
  ];
  ```
- Assign color based on userId hash for consistency
- Store in participant metadata

### 3. Performance Optimizations

#### A. Data Efficiency
- Compress images before upload (max 1MB)
- Lazy load message history (load 20 at a time)
- Use WebSocket for real-time (not polling)
- Cache user colors locally
- Debounce typing indicators (500ms)

#### B. Message Loading Strategy
- Load last 20 messages on open
- "Load More" button for older messages
- Only fetch messages from user's join date
- Virtual scrolling for large message lists

### 4. Implementation Steps

**Phase 1: Backend Setup**
1. Add Socket.IO to backend
2. Create group management endpoints
3. Add user color assignment logic
4. Implement real-time message broadcasting

**Phase 2: Frontend Core**
1. Add Socket.IO client
2. Update chat list to show groups
3. Create group chat component
4. Implement message rendering with colors

**Phase 3: Features**
1. Add image upload
2. Add emoji picker
3. Implement typing indicators
4. Add unread counters

**Phase 4: Polish**
1. Add group discovery UI
2. Implement profile viewing from group
3. Optimize performance
4. Testing

### 5. API Endpoints Needed

```typescript
// Group Management
POST   /api/groups              - Create group
GET    /api/groups              - List available groups
GET    /api/groups/:id          - Get group details
POST   /api/groups/:id/join     - Join group
POST   /api/groups/:id/leave    - Leave group
GET    /api/groups/:id/members  - Get group members

// Messages
GET    /api/chats/:id/messages  - Get messages (with pagination, from join date)
POST   /api/chats/:id/messages  - Send message
POST   /api/chats/:id/upload    - Upload image

// Real-time (Socket.IO)
group:join      - User joins group
group:leave     - User leaves group
group:message   - New message
group:typing    - User typing
group:read      - User read messages
```

### 6. Database Schema Updates Needed

```sql
-- Add color to participants (if not in metadata)
ALTER TABLE chat_participants ADD COLUMN color VARCHAR(7);

-- Index for performance
CREATE INDEX idx_chat_messages_chatid_createdat ON chat_messages(chatId, createdAt DESC);
CREATE INDEX idx_chat_participants_userid ON chat_participants(userId);
CREATE INDEX idx_chats_type_active ON chats(type, isActive);
```

### 7. Future Enhancements (Phase 2)
- Group creation by users (+ button)
- Group avatars
- Message reactions
- Reply to specific messages
- Search within group
- Pinned messages
- Admin roles (if needed later)

## Notes
- Start with predefined groups (no + button yet)
- Keep it simple and WhatsApp-like
- Focus on performance and real-time
- Only text, emoji, and images
- Messages only visible from join date
- Each user has consistent color in each group

## Estimated Complexity
- Backend: Medium (Socket.IO setup is main work)
- Frontend: Medium-High (real-time UI updates, color management)
- Testing: High (real-time features need thorough testing)

## Timeline Estimate
- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 2-3 hours
- Phase 4: 2-3 hours
- **Total: ~10-13 hours** for full implementation
