# ClanPlug Quick Reference Guide

## 🚀 Deployment URLs

### Production
- **Frontend**: https://clanplug.vercel.app
- **Backend**: https://clanplug-o7rp.onrender.com
- **Database**: PostgreSQL on Render

### Latest Deployment
- **Frontend**: https://web-e64qfq0ix-oracles-projects-0d30db20.vercel.app

## 📱 Key Features

### Social Feed
- **URL**: `/feed`
- **Features**:
  - TikTok-style algorithm (no consecutive posts from same user)
  - Follow button on each post
  - Direct message button on each post
  - Like, comment, share actions
  - Bookmark/Favorites system
  - Create new posts

### Chat System
- **URL**: `/chat`
- **Features**:
  - WhatsApp-style interface
  - Real-time messaging (polling)
  - Direct chat creation from feed
  - Message history

### Profile
- **URL**: `/profile`
- **Features**:
  - Profile picture upload (Cloudinary)
  - Profile editing
  - View own posts

## 🔧 Quick Commands

### Deploy Frontend
```bash
cd web
vercel --prod
```

### Deploy Backend
```bash
git add -A
git commit -m "Your message"
git push origin main
# Render auto-deploys
```

### Build Backend Locally
```bash
npm run build
```

### Run Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

### Create Test Posts
```bash
node create-social-posts.js
```

### Manage Users (KYC)
```bash
node manage-user.js
```

## 🐛 Common Issues & Quick Fixes

### Issue: Chat 400 Error
**Fix**: Ensure participants array is passed
```javascript
{
  type: 'DIRECT',
  participants: [userId]
}
```

### Issue: Feed Not Loading
**Fix**: Check backend is running on Render
```bash
curl https://clanplug-o7rp.onrender.com/health
```

### Issue: Profile Picture Not Uploading
**Fix**: Verify Cloudinary credentials in `.env`
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Issue: Follow Button Not Working
**Fix**: Use correct endpoint format
```
POST /api/follow/:userId
DELETE /api/follow/:userId
```

## 📊 API Endpoints Quick Reference

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

### Posts
```
GET  /api/posts/feed          # TikTok-style feed
POST /api/posts               # Create post
POST /api/posts/:id/like      # Like/unlike
POST /api/posts/:id/bookmark  # Bookmark/unbookmark
```

### Users
```
GET  /api/users/profile       # Get profile
PUT  /api/users/profile       # Update profile
POST /api/users/avatar        # Upload avatar
```

### Follow
```
POST   /api/follow/:userId    # Follow user
DELETE /api/follow/:userId    # Unfollow user
GET    /api/follow/:userId/followers
GET    /api/follow/:userId/following
```

### Chat
```
GET  /api/chats               # Get user chats
POST /api/chats               # Create chat
GET  /api/chats/:id/messages  # Get messages
POST /api/chats/:id/messages  # Send message
```

## 🔐 Environment Variables

### Frontend (.env.vercel)
```
NEXT_PUBLIC_API_URL=https://clanplug-o7rp.onrender.com
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📁 Important Files

### Frontend
- `web/src/app/feed/page.tsx` - Social feed
- `web/src/app/chat/page.tsx` - Chat interface
- `web/src/app/profile/page.tsx` - User profile
- `web/src/lib/api.ts` - API client

### Backend
- `src/services/post.service.ts` - Post logic (TikTok algorithm)
- `src/controllers/chat.controller.ts` - Chat endpoints
- `src/routes/` - API routes
- `prisma/schema.prisma` - Database schema

### Documentation
- `PROJECT_HANDOFF.md` - Complete project documentation
- `SESSION_SUMMARY.md` - Latest session summary
- `YOUR_URLS.md` - All project URLs
- `CLOUDINARY_SETUP.md` - Cloudinary setup guide

## 🎯 Testing Checklist

Before considering a feature complete:
- [ ] Works on desktop
- [ ] Works on mobile
- [ ] No console errors
- [ ] API returns correct data
- [ ] Loading states work
- [ ] Error handling works
- [ ] Deployed to production
- [ ] Tested in production

## 💡 Pro Tips

1. **Always test locally first**: `npm run dev` in both web and root
2. **Check Render logs**: If backend issues, check Render dashboard
3. **Vercel preview**: Each commit gets a preview URL
4. **Database changes**: Always run migrations after schema changes
5. **Cloudinary**: Check usage limits in dashboard

## 🆘 Emergency Contacts

### Services
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **Cloudinary Dashboard**: https://cloudinary.com/console

### Logs
- **Frontend Logs**: Vercel dashboard → Project → Logs
- **Backend Logs**: Render dashboard → Service → Logs
- **Database**: Render dashboard → PostgreSQL → Logs

## 📈 Next Steps

1. Test all features in production
2. Monitor error logs
3. Gather user feedback
4. Implement comments on posts
5. Add real-time notifications
6. Optimize performance

---

**Last Updated**: November 14, 2025
**Quick Access**: Keep this file open for instant reference!
