# 🌐 Your Application URLs

## Frontend (Open this in your browser)
**🎉 Custom Domain**: https://clanplug.site
**WWW**: https://www.clanplug.site
**Vercel URL**: https://clanplug-sable.vercel.app

This is where users will:
- Register new accounts
- Login
- Use VTU services
- Manage wallets
- Access all features

## Backend API (For developers/testing only)
**API URL**: https://api.clanplug.site
**Render URL**: https://clanplug-o7rp.onrender.com

This is the backend API. You won't see a website here - it's just for API calls.

### Test Endpoints:
- Health Check: https://api.clanplug.site/health
- Register: https://api.clanplug.site/api/auth/register
- Login: https://api.clanplug.site/api/auth/login
- VTU Services: https://api.clanplug.site/api/vtu/*

## How It Works

```
User Browser
    ↓
Frontend (Vercel)
https://clanplug.site
    ↓ Makes API calls to
Backend (Render)
https://api.clanplug.site
    ↓ Connects to
Database (Supabase PostgreSQL)
```

## Quick Test

1. **Open Frontend**: https://clanplug.site
2. **Click "Register"** or **"Sign Up"**
3. **Create an account**
4. **Login** with your credentials
5. **Start using the app!**

## For Sharing

Share your **custom domain** with users:
**https://clanplug.site**

Don't share the backend URL - it's only for API calls.

## DNS Configuration (Namecheap)

- `clanplug.site` → Vercel (A record: 76.76.21.21)
- `www.clanplug.site` → Vercel (CNAME: cname.vercel-dns.com)
- `api.clanplug.site` → Render (CNAME: clanplug-o7rp.onrender.com)
