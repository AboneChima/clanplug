# ClanPlug Project Handoff Documentation

## Project Overview
ClanPlug is a social platform with integrated services including VTU (Virtual Top-Up), escrow, chat, and social feed features.

## Architecture

### Frontend (Next.js)
- **Deployment**: Vercel
- **URL**: https://clanplug.vercel.app
- **Location**: `/web` directory
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS

### Backend (Node.js/Express)
- **Deployment**: Render
- **URL**: https://clanplug-o7rp.onrender.com
- **Location**: `/src` directory
- **Framework**: Express with TypeScript
- **Database**: PostgreSQL (hosted on Render)

### Media Storage
- **Service**: Cloudinary
- **Configuration**: See `.env` and `CLOUDINARY_SETUP.md`
- **Usage**: Profile pictures, post images

## Key Features Implemented

### 1. Social Feed (TikTok-Style Algorithm)
- **Location**: `web/src/app/feed/page.tsx`
- **Algorithm**: Posts are mixed so no two consecutive posts are from the same user
- **Backend**: `src/services/post.service.ts` - `getSocialFeed()` method
- **Features**:
  - For You tab with mixed content
  - Favorites tab for bookmarked posts
  - One-click follow buttons on each post
  - Direct message button on each post
  - Like, comment, share, and bookmark actions

### 2. Profile System
- **Location**: `web/src/app/profile/page.tsx`
- **Features**:
  - Instant profile picture upload with Cloudinary
  - Global avatar updates across all components
  - Profile editing

### 3. Chat System
- **Location**: `web/src/app/chat/page.tsx`
- **Features**:
  - WhatsApp-style dark theme interface
  - Real-time messaging with polling
  - Direct chat creation from feed
  - Chat list with last message preview

### 4. Follow System
- **Endpoints**: 
  - POST `/api/follow/:userId` - Follow user
  - DELETE `/api/follow/:userId` - Unfollow user
  - GET `/api/follow/:userId/followers` - Get followers
  - GET `/api/follow/:userId/following` - Get following

### 5. Post System
- **Endpoints**:
  - GET `/api/posts/feed` - Get social feed (TikTok algorithm)
  - POST `/api/posts` - Create post
  - POST `/api/posts/:postId/like` - Like/unlike post
  - POST `/api/posts/:postId/bookmark` - Bookmark/unbookmark post

## Environment Variables

### Frontend (.env.vercel)
```
NEXT_PUBLIC_API_URL=https://clanplug-o7rp.onrender.com
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Deployment Commands

### Frontend (Vercel)
```bash
cd web
vercel --prod
```

### Backend (Render)
- Automatically deploys on git push to main branch
- Manual deploy: Use Render dashboard

### Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

## Testing Accounts
- See `manage-user.js` for user management scripts
- See `create-social-posts.js` for creating test posts

## Common Issues & Solutions

### 1. Chat 400 Error
**Problem**: Creating chat fails with 400 Bad Request
**Solution**: Ensure participants array is passed in request body
```javascript
{
  type: 'DIRECT',
  participants: [userId]
}
```

### 2. Feed Algorithm Not Working
**Problem**: Seeing consecutive posts from same user
**Solution**: Check `getSocialFeed()` in `src/services/post.service.ts` - algorithm mixes posts

### 3. Profile Picture Not Updating
**Problem**: Avatar doesn't update globally
**Solution**: Ensure Cloudinary is configured and `updateAvatar` endpoint is working

### 4. Follow Button 404
**Problem**: Follow button returns 404
**Solution**: Use correct endpoint format `/api/follow/:userId` (not `/api/follow`)

## Database Schema

### Key Models
- **User**: User accounts with KYC status
- **Post**: Social posts with type (SOCIAL_POST, MARKETPLACE, etc.)
- **Follow**: Follow relationships
- **Like**: Post likes
- **Comment**: Post comments
- **Chat**: Chat conversations
- **Message**: Chat messages
- **Transaction**: Financial transactions

## API Documentation

### Authentication
All protected endpoints require Bearer token:
```
Authorization: Bearer <accessToken>
```

### Key Endpoints

#### Posts
- `GET /api/posts/feed` - Get TikTok-style feed
- `POST /api/posts` - Create post (requires title, description, type)
- `POST /api/posts/:postId/like` - Toggle like
- `POST /api/posts/:postId/bookmark` - Toggle bookmark

#### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

#### Follow
- `POST /api/follow/:userId` - Follow user
- `DELETE /api/follow/:userId` - Unfollow user

#### Chat
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create chat (requires participants array)
- `GET /api/chats/:chatId/messages` - Get messages
- `POST /api/chats/:chatId/messages` - Send message

## Project Structure

```
clanplug/
├── web/                    # Frontend (Next.js)
│   ├── src/
│   │   ├── app/           # Pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/          # Utilities
│   │   └── services/     # API services
│   └── public/           # Static assets
├── src/                   # Backend (Express)
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   └── config/           # Configuration
├── prisma/               # Database schema
└── scripts/              # Utility scripts
```

## Next Steps / TODO

1. **Implement Bookmark Model**: Currently using placeholder, need proper database model
2. **Add Comments**: Implement comment functionality on posts
3. **Real-time Chat**: Replace polling with WebSocket for better performance
4. **Notifications**: Add notification system for likes, follows, messages
5. **Search**: Implement user and post search
6. **Stories**: Optional - implement Instagram-style stories
7. **Post Analytics**: Track views, engagement metrics

## Support & Maintenance

### Logs
- **Frontend**: Vercel dashboard
- **Backend**: Render dashboard
- **Database**: Render PostgreSQL logs

### Monitoring
- Check Render dashboard for backend health
- Check Vercel dashboard for frontend deployments
- Monitor Cloudinary usage for media storage

### Backup
- Database: Render provides automatic backups
- Code: GitHub repository

## Contact Information
- **Frontend URL**: https://clanplug.vercel.app
- **Backend URL**: https://clanplug-o7rp.onrender.com
- **Repository**: [Your GitHub URL]

---

**Last Updated**: November 14, 2025
**Version**: 1.0.0
