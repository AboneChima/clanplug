# 🌐 Your Application URLs

## Frontend (Open this in your browser)
**Main URL**: https://web-op602jhip-oracles-projects-0d30db20.vercel.app

This is where users will:
- Register new accounts
- Login
- Use VTU services
- Manage wallets
- Access all features

## Backend API (For developers/testing only)
**API URL**: https://clanplug-o7rp.onrender.com

This is the backend API. You won't see a website here - it's just for API calls.

### Test Endpoints:
- Health Check: https://clanplug-o7rp.onrender.com/health
- Register: https://clanplug-o7rp.onrender.com/api/auth/register
- Login: https://clanplug-o7rp.onrender.com/api/auth/login
- VTU Services: https://clanplug-o7rp.onrender.com/api/vtu/*

## How It Works

```
User Browser
    ↓
Frontend (Vercel)
https://web-op602jhip-oracles-projects-0d30db20.vercel.app
    ↓ Makes API calls to
Backend (Render)
https://clanplug-o7rp.onrender.com
    ↓ Connects to
Database (Render PostgreSQL)
```

## Quick Test

1. **Open Frontend**: https://web-op602jhip-oracles-projects-0d30db20.vercel.app
2. **Click "Register"** or **"Sign Up"**
3. **Create an account**
4. **Login** with your credentials
5. **Start using the app!**

## For Sharing

Share the **frontend URL** with users:
https://web-op602jhip-oracles-projects-0d30db20.vercel.app

Don't share the backend URL - it's only for API calls.

## Custom Domain (Optional)

You can add a custom domain like:
- www.lordmoon.com
- app.lordmoon.com

To set this up:
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Domains
4. Add your custom domain
5. Update DNS records as instructed
