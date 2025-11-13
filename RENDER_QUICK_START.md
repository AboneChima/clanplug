# Render Deployment - Quick Reference

## Your Setup

**GitHub Repo**: https://github.com/AboneChima/clanplug
**Render Dashboard**: https://dashboard.render.com

## Services to Create

### 1. PostgreSQL Database
- Name: `lordmoon-db`
- Plan: Free
- Copy the **Internal Database URL**

### 2. Web Service
- Name: `lordmoon-backend`
- Repo: `AboneChima/clanplug`
- Branch: `main`
- Build: `npm install && npx prisma generate && npm run build`
- Start: `npx prisma migrate deploy && npm start`
- Plan: Free

## Environment Variables (Copy-Paste Ready)

```
NODE_ENV=production
PORT=4000
JWT_SECRET=b4642a54edf0375812be8d34bc4f176b22b760d2572e7ec8c97733baf83e4f1b7c7986eeebcbd714aa97910f6f76016d82af5bf43e0f4514c6700c355ce11fc
JWT_REFRESH_SECRET=972c971c1bc28c8d8875edf5ff636cd7538eeeb6353ecfa242aec071b6c61bd1a08224714925be2c8107132567a7936f85c7fd9ea5c6c4c61574d87893be0c83
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=10
APP_NAME=Lordmoon
ADMIN_EMAIL=admin@lordmoon.com
ADMIN_ACCESS_KEY=lordmoon_admin_2024_secure_key
DEFAULT_CURRENCY=NGN
SUPPORTED_CURRENCIES=NGN,USD
DEPOSIT_FEE=3
WITHDRAWAL_FEE=3
TRANSACTION_FEE=3
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FLUTTERWAVE_SECRET_KEY=FLWSECK-0e7bf7febea7c8cbe547fa81ad837267-19a44a027advt-X
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-16afbf00220eb4faec6bea5630fc7ea5-X
FLUTTERWAVE_WEBHOOK_SECRET=sdAsdBBNX5h992LKLxshg3DCccMtytftsx
CLUBKONNECT_USERID=CK101266657
CLUBKONNECT_APIKEY=18V8265C71KTKBO89995TL7WUR30K5XCM0IMPOP4B5Y2UJSV6U9U5372D10T746V
CLUBKONNECT_BASE_URL=https://www.nellobytesystems.com
NOWPAYMENTS_API_KEY=FN8DS05-8ST4E7Q-GTAZHSX-GH9N39Y
NOWPAYMENTS_IPN_SECRET=V/BlBcg7sb2tpd58mvi+Dk02c5NKz3Zw
NOWPAYMENTS_BASE_URL=https://api.nowpayments.io/v1
NOWPAYMENTS_SANDBOX=false
```

**After deployment, add these:**
```
APP_URL=https://lordmoon-backend.onrender.com
FRONTEND_URL=https://web-gapmg8c9v-oracles-projects-0d30db20.vercel.app
```

## After Deployment

1. Get your Render URL (e.g., `https://lordmoon-backend.onrender.com`)
2. Test: `https://lordmoon-backend.onrender.com/health`
3. Update `web/.env.local` with your Render URL
4. Redeploy frontend: `cd web && vercel --prod`

## Troubleshooting

**Build fails?**
- Check logs in Render dashboard
- Make sure all dependencies are in package.json

**Database connection error?**
- Verify DATABASE_URL is set correctly
- Use "Internal Database URL" not "External"

**App not responding?**
- Free tier spins down after 15 min
- First request takes ~30s to wake up
- Use UptimeRobot to keep it awake

## Keep It Awake (Optional)

Sign up at https://uptimerobot.com (free)
- Monitor: `https://lordmoon-backend.onrender.com/health`
- Interval: Every 10 minutes

## Upgrade to Paid ($7/month)

Benefits:
- No spin-down
- Faster performance
- More resources
- Priority support
