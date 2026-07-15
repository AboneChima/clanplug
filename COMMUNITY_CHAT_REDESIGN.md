# Community Chat System - Complete Redesign

## Architecture Overview

### Database Structure
```
Communities (Groups)
- id
- name
- description
- image
- banner
- type (GAMING, GENERAL)
- game (PUBG, FREE_FIRE, COD, etc.)
- isPublic
- memberCount
- createdAt
- createdBy

CommunityMembers
- id
- communityId
- userId
- role (member, admin, creator)
- color (assigned unique color)
- joinedAt
- lastReadAt
- isActive

CommunityMessages
- id
- communityId
- userId
- content
- type (TEXT, IMAGE, SYSTEM)
- attachments
- replyToId
- createdAt
- isDeleted

DirectChats (1-on-1)
- id
- user1Id
- user2Id
- lastMessageAt
- createdAt

DirectMessages
- id
- chatId
- senderId
- content
- type
- attachments
- createdAt
```

### API Endpoints

#### Communities
```
GET    /api/communities/discover          - All available communities
GET    /api/communities/my-communities     - User's joined communities
GET    /api/communities/:id                - Community details
POST   /api/communities/:id/join           - Join community
POST   /api/communities/:id/leave          - Leave community
GET    /api/communities/:id/members        - Community members
GET    /api/communities/:id/messages       - Community messages
POST   /api/communities/:id/messages       - Send message
```

#### Direct Messages
```
GET    /api/direct-chats                   - User's direct chats
GET    /api/direct-chats/:userId/start     - Start/get direct chat
GET    /api/direct-chats/:chatId/messages  - Direct messages
POST   /api/direct-chats/:chatId/messages  - Send direct message
```

### Frontend Structure

#### Pages
```
/communities/discover              - Browse all communities
/communities/:id                   - Community details & info
/communities/:id/chat              - Community chat
/communities/:id/members           - Community members list
/messages                          - Main messages page (communities + directs)
/messages/direct/:chatId           - Direct chat
/user/:userId                      - User profile
```

#### Components
```
<CommunityDiscoveryCard />         - Horizontal scrollable discovery
<CommunityListItem />              - Community in messages list
<DirectChatListItem />             - Direct chat in messages list
<CommunityMessageBubble />         - Message with avatar & color
<DirectMessageBubble />            - Simple message bubble
<MemberListItem />                 - Member in community
<CommunityHeader />                - Community name/info header
```

### User Color System
- 13 predefined colors
- Assigned based on userId + communityId hash
- Consistent across app
- Colors: Red, Teal, Blue, Orange, Mint, Yellow, Purple, Sky, Peach, Rose, Plum, Navy, Green

### Real-time Events (Socket.IO)

#### Community Events
```
community:join                     - User joined
community:leave                    - User left
community:message:new              - New message
community:typing                   - Someone typing
community:read                     - Message read
```

#### Direct Events
```
direct:message:new                 - New DM
direct:typing                      - Typing in DM
direct:read                        - DM read
```

## Implementation Order

1. ✅ Backend: Community models & services
2. ✅ Backend: Separate direct chat logic
3. ✅ Backend: Community APIs
4. ✅ Backend: Socket.IO events
5. ✅ Frontend: Community discovery UI
6. ✅ Frontend: Messages page redesign
7. ✅ Frontend: Community chat page
8. ✅ Frontend: Community info page
9. ✅ Frontend: Member list page
10. ✅ Frontend: User profile navigation
11. ✅ Deploy & test

## Key Features

### Discover Communities
- Always visible horizontal list
- Shows "Joined" badge if already member
- Tap to see details or enter chat
- Never removes from discovery

### Messages Page
```
┌─────────────────────────┐
│ 📱 My Communities       │
├─────────────────────────┤
│ 🎮 PUBG Mobile         │
│ John: Anyone online?    │
│ 12:30 PM          [24] │
├─────────────────────────┤
│ 🔥 Free Fire           │
│ Sarah: Let's play       │
│ 11:15 AM          [5]  │
├─────────────────────────┤
│ 💬 Direct Messages     │
├─────────────────────────┤
│ 👤 Kelly               │
│ See you tomorrow        │
│ Yesterday               │
├─────────────────────────┤
│ 👤 John                │
│ Thanks!                 │
│ 2 days ago              │
└─────────────────────────┘
```

### Community Chat
```
┌─────────────────────────┐
│ ← PUBG Mobile      ⋮   │
├─────────────────────────┤
│                         │
│ 🟢 John                │
│ Anyone online?          │
│ 11:45 AM                │
│                         │
│ 🔵 Sarah               │
│ I'm here!               │
│ 11:46 AM                │
│                         │
│ 🟠 Mike                │
│ Let's squad up          │
│ 11:47 AM                │
│                         │
├─────────────────────────┤
│ [Type a message...]  📷│
└─────────────────────────┘
```

### Community Info Page
```
┌─────────────────────────┐
│ [Banner Image]          │
│                         │
│ 🎮 PUBG Mobile         │
│ A community for PUBG... │
│                         │
│ 👥 1,234 members        │
│ 📅 Created Jun 2024     │
│                         │
│ [View Members] →        │
│                         │
│ [Chat] [Leave]          │
└─────────────────────────┘
```

## Mobile-First Design Principles

- Full-page navigation (no modals for major views)
- Compact spacing
- Fast scrolling
- Smooth transitions
- WhatsApp-inspired UI
- Clean typography
- Minimal interface
- Optimized for touch
