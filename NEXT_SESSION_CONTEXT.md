# 🚀 ClanPlug - Next Session Context

## CRITICAL: Read This First!

This document contains EVERYTHING you need to continue working on ClanPlug without confusion.

---

## 📍 Project Architecture

### Frontend (Next.js)
- **Platform**: Vercel
- **URL**: https://clanplug.vercel.app
- **Deployment URL**: https://web-8f63x60mu-oracles-projects-0d30db20.vercel.app
- **Location**: `/web` directory
- **Framework**: Next.js 14 with TypeScript
- **Deploy Command**: `cd web && vercel --prod`

### Backend (Node.js/Express)
- **Platform**: Render
- **URL**: https://clanplug-o7rp.onrender.com
- **Location**: `/src` directory (root of project)
- **Framework**: Express with TypeScript
- **Deploy**: Auto-deploys on `git push origin main`

### Database
- **Platform**: Render PostgreSQL
- **Type**: PostgreSQL
- **Location**: Hosted on Render (same as backend)
- **Connection**: Via `DATABASE_URL` environment variable
- **Migrations**: Run automatically on Render deployment

### Media Storage
- **Platform**: Cloudinary
- **Usage**: Profile pictures, post images, videos
- **Config**: See `.env` and `CLOUDINARY_SETUP.md`

---

## 🔑 Important URLs & IDs

### Vercel
- **Dashboard**: https://vercel.com/oracles-projects-0d30db20
- **Project Name**: `web`
- **Organization**: `oracles-projects-0d30db20`

### Render
- **Dashboard**: https://dashboard.render.com
- **Service Name**: `clanplug` (backend)
- **Database**: PostgreSQL instance on Render

### GitHub
- **Repository**: https://github.com/AboneChima/clanplug.git
- **Branch**: `main`

---

## 🚀 Deployment Guide

### Deploy Frontend (Vercel)
```bash
cd web
vercel --prod
```
**Result**: New deployment URL (always starts with `https://web-...vercel.app`)

### Deploy Backend (Render)
```bash
git add -A
git commit -m "Your commit message"
git push origin main
```
**Result**: Render auto-deploys backend + runs database migrations

### Check Deployment Status
- **Frontend**: Check Vercel dashboard
- **Backend**: Check Render dashboard
- **Database**: Migrations run automatically on Render

---

## 📂 Project Structure

```
clanplug/
├── web/                    # Frontend (Next.js) - DEPLOY TO VERCEL
│   ├── src/
│   │   ├── app/           # Pages (feed, profile, chat, posts, etc.)
│   │   ├── components/    # React components
│   │   ├── contexts/      # Auth, Toast contexts
│   │   ├── lib/          # API client, utilities
│   │   └── services/     # Frontend services
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
│
├── src/                   # Backend (Express) - DEPLOY TO RENDER
│   ├── controllers/      # API controllers
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, error handling
│   └── config/           # Configuration
│
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema (PostgreSQL)
│
├── .env                  # Backend environment variables
├── .env.vercel          # Frontend environment variables
└── package.json         # Backend dependencies
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...  # Render PostgreSQL
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.vercel)
```env
NEXT_PUBLIC_API_URL=https://clanplug-o7rp.onrender.com
```

---

## 📊 Database Information

### Connection
- **Host**: Render PostgreSQL
- **Access**: Via `DATABASE_URL` in `.env`
- **Schema**: Managed by Prisma

### Running Migrations
```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Create migration (local only - won't work if DB is remote)
npx prisma migrate dev --name migration_name

# Deploy migrations (Render does this automatically)
npx prisma migrate deploy
```

### Important Tables
- `users` - User accounts
- `posts` - Social posts, marketplace listings
- `bookmarks` - User bookmarked posts (NEW!)
- `likes` - Post likes
- `follows` - Follow relationships
- `chats` - Chat conversations
- `messages` - Chat messages
- `wallets` - User wallets
- `transactions` - Financial transactions

---

## 🎯 Recent Changes (Last Session)

### 1. TikTok-Style Feed Algorithm
- **File**: `src/services/post.service.ts`
- **Feature**: Posts mixed so no consecutive posts from same user
- **Endpoint**: `GET /api/posts/feed`

### 2. Removed Stories
- **File**: `web/src/app/feed/page.tsx`
- **Change**: Removed stories section for cleaner interface

### 3. Added Favorites Tab
- **Files**: 
  - `web/src/app/feed/page.tsx` (frontend)
  - `src/services/post.service.ts` (backend)
  - `prisma/schema.prisma` (database)
- **Feature**: Users can bookmark posts and view in Favorites tab
- **Endpoints**: 
  - `POST /api/posts/:postId/bookmark` - Toggle bookmark
  - `GET /api/posts/bookmarks` - Get bookmarked posts

### 4. Fixed Chat Creation
- **File**: `web/src/app/feed/page.tsx`
- **Change**: Better error messages for chat creation
- **Message**: "You need to follow this user first before messaging them"

### 5. Fixed Marketplace Listings
- **File**: `web/src/app/posts/page.tsx`
- **Change**: Shows ALL posts from ALL users (not just own posts)
- **Type**: Changed from `GAME_ACCOUNT` to `MARKETPLACE`

### 6. Fixed Profile Picture Sync
- **File**: `web/src/app/profile/page.tsx`
- **Change**: Added timestamp to force cache refresh across devices
- **Format**: `image.jpg?t=1731600000000`

---

## 🐛 Common Issues & Solutions

### Issue: "Can't reach database"
**Cause**: Trying to run migrations locally on remote database
**Solution**: Push to GitHub, Render will run migrations automatically

### Issue: Profile picture not updating
**Cause**: Browser caching
**Solution**: Already fixed with timestamp cache-busting

### Issue: Favorites not showing
**Cause**: Was filtering local state, not fetching from backend
**Solution**: Already fixed with backend endpoint

### Issue: Chat 400 error
**Cause**: Missing participants array
**Solution**: Already fixed with better error handling

### Issue: Marketplace listing 400 error
**Cause**: Wrong field names (content vs description, wrong type)
**Solution**: Already fixed with correct field mapping

---

## 📝 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

### Posts
- `GET /api/posts/feed` - Get TikTok-style feed
- `GET /api/posts?type=MARKETPLACE` - Get marketplace listings
- `GET /api/posts/bookmarks` - Get bookmarked posts
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/bookmark` - Bookmark/unbookmark post

### Users
- `GET /api/users/profile` - Get current user
- `PUT /api/users/profile` - Update profile (including avatar)
- `POST /api/follow/:userId` - Follow user
- `DELETE /api/follow/:userId` - Unfollow user

### Chat
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create chat (requires participants array)
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/chats/:id/messages` - Send message

---

## 🧪 Testing Checklist

Before considering work complete:
- [ ] Test on desktop browser
- [ ] Test on mobile browser
- [ ] Check browser console for errors
- [ ] Verify API returns correct data
- [ ] Test loading states
- [ ] Test error handling
- [ ] Deploy to Vercel (frontend)
- [ ] Push to GitHub (backend auto-deploys)
- [ ] Test in production

---

## 📚 Documentation Files

Read these for detailed information:
- `PROJECT_HANDOFF.md` - Complete project overview
- `QUICK_REFERENCE.md` - Quick commands and fixes
- `FIXES_APPLIED.md` - Chat and marketplace fixes
- `PROFILE_AND_FAVORITES_FIXES.md` - Profile and favorites fixes
- `SESSION_SUMMARY.md` - Last session summary
- `TEST_GUIDE.md` - Testing instructions
- `YOUR_URLS.md` - All project URLs
- `CLOUDINARY_SETUP.md` - Cloudinary configuration

---

## 🎯 How to Continue Next Session

### Step 1: Understand Current State
Read this file completely (you're doing it now!)

### Step 2: Check Deployment Status
```bash
# Check if backend is running
curl https://clanplug-o7rp.onrender.com/health

# Check frontend
# Visit: https://clanplug.vercel.app
```

### Step 3: Pull Latest Code
```bash
git pull origin main
npm install
cd web && npm install
```

### Step 4: Start Working
- Frontend changes: Edit files in `/web/src/app/`
- Backend changes: Edit files in `/src/`
- Database changes: Edit `prisma/schema.prisma`

### Step 5: Deploy
```bash
# Frontend
cd web
vercel --prod

# Backend
git add -A
git commit -m "Your changes"
git push origin main
```

---

## ⚠️ CRITICAL REMINDERS

1. **Database is on Render** - NOT local, NOT Supabase
2. **Frontend deploys to Vercel** - Use `vercel --prod` in `/web` directory
3. **Backend auto-deploys** - Just push to GitHub
4. **Migrations run automatically** - On Render deployment
5. **Two separate deployments** - Frontend (Vercel) + Backend (Render)

---

## 🆘 Emergency Contacts

### Services
- **Vercel**: https://vercel.com/dashboard
- **Render**: https://dashboard.render.com
- **Cloudinary**: https://cloudinary.com/console
- **GitHub**: https://github.com/AboneChima/clanplug

### Logs
- **Frontend**: Vercel dashboard → Project → Logs
- **Backend**: Render dashboard → Service → Logs
- **Database**: Render dashboard → PostgreSQL → Logs

---

## 🎓 Quick Start Commands

```bash
# Install dependencies
npm install
cd web && npm install && cd ..

# Generate Prisma client
npx prisma generate

# Build backend
npm run build

# Deploy frontend
cd web && vercel --prod

# Deploy backend
git add -A && git commit -m "Update" && git push origin main

# Check backend health
curl https://clanplug-o7rp.onrender.com/health
```

---

## 📞 What to Say to Continue

**Option 1 - General Continue**:
```
"I'm continuing work on ClanPlug. I've read NEXT_SESSION_CONTEXT.md. 
The frontend is on Vercel, backend on Render, database on Render PostgreSQL. 
What should we work on next?"
```

**Option 2 - Specific Issue**:
```
"I'm seeing [describe issue] on ClanPlug. According to NEXT_SESSION_CONTEXT.md, 
the frontend is at https://clanplug.vercel.app and backend at 
https://clanplug-o7rp.onrender.com. Can you help debug?"
```

**Option 3 - New Feature**:
```
"I want to add [feature] to ClanPlug. I've read NEXT_SESSION_CONTEXT.md. 
Should I modify the frontend (Vercel) or backend (Render)?"
```

---

## ✅ Current Status

- ✅ TikTok-style feed algorithm working
- ✅ Stories removed
- ✅ Favorites tab with backend persistence
- ✅ Chat creation with better error handling
- ✅ Marketplace showing all listings
- ✅ Profile picture syncing across devices
- ✅ Follow/message buttons on posts
- ✅ All features deployed and live

---

**Last Updated**: November 14, 2025
**Version**: 2.0
**Status**: Production Ready
**Next Session**: Use this document as your guide!

---

## 🎯 Pro Tips

1. **Always check this file first** before asking questions
2. **Frontend = Vercel, Backend = Render** - Remember this!
3. **Database is remote** - Can't run migrations locally
4. **Push to GitHub** - Backend deploys automatically
5. **Read the docs** - All answers are in the documentation files

**Good luck with the next session! 🚀**
