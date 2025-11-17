# Project Context & Deployment Guide

## 🚀 DEPLOYMENT INSTRUCTIONS

### Backend Deployment (Render)
**URL:** https://jobica-backend.onrender.com

**How to Deploy:**
1. Make changes to backend files (anything in `src/` folder)
2. Commit and push to GitHub:
   ```bash
   git add -A
   git commit -m "Your commit message"
   git push origin main
   ```
3. Render auto-deploys from GitHub (takes ~2-3 minutes)
4. Check Render dashboard for deployment status

**Important:** Backend uses PostgreSQL database on Render. Never run database scripts locally.

---

### Frontend Deployment (Vercel)
**URL:** https://web-ib4rnl9hw-oracles-projects-0d30db20.vercel.app

**How to Deploy:**
1. Make changes to frontend files (anything in `web/` folder)
2. Run from `web` directory:
   ```bash
   cd web
   vercel --prod
   ```
3. Deployment takes ~3-5 seconds
4. Returns new production URL

**Note:** Vercel has a limit of 100 deployments per day on free tier.

---

## 📋 VERIFICATION SYSTEMS

### 1. KYC Verification (`isKYCVerified`)
- **Purpose:** Identity verification for marketplace access
- **Database:** `User.isKYCVerified` (boolean field)
- **Required For:** Posting on marketplace (GAME_ACCOUNT, MARKETPLACE_LISTING)
- **How to Verify:** Complete KYC form at `/kyc` page
- **Badge:** Shows as small checkmark badge on avatar

### 2. Verification Badge (`verificationBadge`)
- **Purpose:** Premium subscription feature (₦2,000/month)
- **Database:** `VerificationBadge` table (separate)
- **Benefits:** 
  - Post images on social feed
  - Unlimited posts
  - Username protection
  - Blue verified checkmark
- **How to Get:** Purchase from profile page
- **Badge:** Shows as blue verified checkmark next to name

**IMPORTANT:** These are TWO DIFFERENT systems. Don't confuse them!

---

## 🎯 POST RESTRICTIONS

### Marketplace (GAME_ACCOUNT, MARKETPLACE_LISTING)
- ✅ **Requires:** KYC Verification (`isKYCVerified = true`)
- ✅ **Allows:** Images and videos
- ✅ **Limit:** Unlimited posts for KYC verified users
- ❌ **Without KYC:** Cannot post at all

### Social Feed (SOCIAL_POST)
- ✅ **Text Posts:** Anyone can post (20 post limit for non-verified)
- ✅ **Image Posts:** Requires Verification Badge
- ✅ **Verified Users:** Unlimited posts with images

---

## 🔧 MANUAL USER VERIFICATION

### Verify User via API:
```bash
POST https://jobica-backend.onrender.com/api/verification/manual-verify
Content-Type: application/json

{
  "email": "user@example.com",
  "secret": "verify-user-2024"
}
```

**PowerShell Command:**
```powershell
$body = @{email="user@example.com";secret="verify-user-2024"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://jobica-backend.onrender.com/api/verification/manual-verify" -Method POST -ContentType "application/json" -Body $body
```

**Note:** Email must be lowercase!

---

## 📁 PROJECT STRUCTURE

```
Lordmoon/
├── src/                    # Backend (Node.js + Express + Prisma)
│   ├── controllers/        # API controllers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   └── config/            # Configuration
├── web/                   # Frontend (Next.js + React)
│   ├── src/app/          # Pages
│   ├── src/components/   # React components
│   └── src/contexts/     # React contexts
└── prisma/               # Database schema
```

---

## 🐛 COMMON ISSUES

### "Verification badge not showing"
- Check if `verificationBadge` data is included in API response
- Verify user has active badge with `expiresAt` in future
- Check browser console for API response structure

### "Follow/Unfollow not working"
- Check if `isFollowing` field is returned from API
- Verify follow API endpoint returns success
- Check browser console for errors

### "Marketplace post blocked"
- User needs KYC verification (`isKYCVerified = true`)
- Complete KYC form at `/kyc` page
- Check user record in database

### "Can't post images on social feed"
- User needs Verification Badge (not KYC)
- Purchase badge from profile page (₦2,000)
- Badge lasts 30 days

---

## 📊 DATABASE TABLES

### Key Tables:
- `User` - User accounts (includes `isKYCVerified`)
- `VerificationBadge` - Premium verification subscriptions
- `Post` - All posts (social + marketplace)
- `Follow` - User follow relationships
- `Chat` - Direct messages
- `Wallet` - User wallets (NGN, USD, etc.)
- `Transaction` - Payment history

---

## 🎨 UI COMPONENTS

### Verification Badges:
```tsx
{/* KYC Badge - Small checkmark on avatar */}
{user.isKYCVerified && (
  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full">
    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  </div>
)}

{/* Verification Badge - Blue checkmark next to name */}
{user.verificationBadge?.status === 'active' && (
  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)}
```

---

## ✅ RECENT CHANGES

### Session Summary:
1. ✅ Separated KYC verification from Verification Badge
2. ✅ Marketplace now requires KYC verification
3. ✅ Social feed images require Verification Badge
4. ✅ Fixed chat scrolling (only messages scroll)
5. ✅ Made KYC form compact on mobile
6. ✅ Added manual verification API endpoint
7. ✅ Fixed verification badge display on profiles

---

## 🔐 ENVIRONMENT VARIABLES

### Backend (.env):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_*` - Image upload credentials
- `PAYSTACK_SECRET_KEY` - Payment gateway

### Frontend (web/.env.local):
- `NEXT_PUBLIC_API_URL` - Backend API URL

---

**Last Updated:** November 17, 2025
**Current Version:** Production
**Status:** ✅ All systems operational
