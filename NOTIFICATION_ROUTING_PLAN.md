# Notification Routing & Profile Marketplace Fix Plan

## Tasks to Complete:

### 1. Make Notifications Clickable
- **Message notifications** → Navigate to chat with that user
- **Like/Comment/Favorite notifications** → Open post in modal overlay
- **Follow notifications** → Navigate to user's profile
- Add `handleNotificationClick` function based on notification type and data

### 2. Add Post Modal Overlay
- Create reusable PostModal component
- Similar to image viewer modal
- Shows full post with comments
- Can be triggered from notifications

### 3. Fix Marketplace Listing Clicks from Profiles
- **User viewing own profile** → Click listing → Go to marketplace post
- **User A viewing User B's profile** → Click listing → Go to marketplace post
- Update profile page post cards to handle marketplace navigation

## Implementation Steps:

1. Add notification click handler with routing logic
2. Create PostModal component
3. Update profile page marketplace post clicks
4. Test all notification types
5. Deploy

## Notification Data Structure Needed:
```typescript
{
  type: 'CHAT' | 'LIKE' | 'COMMENT' | 'FOLLOW' | 'FAVORITE',
  data: {
    chatId?: string,
    postId?: string,
    userId?: string,
    fromUserId?: string
  }
}
```
