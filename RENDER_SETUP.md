# Render.com Deployment Guide

## Why Render?
- ✅ **Free tier** (750 hours/month)
- ✅ **Free PostgreSQL** database
- ✅ **Auto-deploy** from GitHub
- ✅ **No credit card** required
- ✅ **Easy setup**

## Step 1: Push to GitHub

```bash
git add -A
git commit -m "Add Render configuration"
git push origin main
```

## Step 2: Sign Up on Render

1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

## Step 3: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your `lordmoon` repository

## Step 4: Configure Service

Render will auto-detect settings from `render.yaml`, but verify:

- **Name**: lordmoon-backend
- **Runtime**: Node
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npx prisma migrate deploy && npm start`
- **Plan**: Free

## Step 5: Add PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. **Name**: lordmoon-db
3. **Plan**: Free
4. Click **"Create Database"**

## Step 6: Link Database to Web Service

1. Go to your web service
2. Click **"Environment"** tab
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Click "Add from Database" → Select `lordmoon-db` → `Internal Database URL`

## Step 7: Add Environment Variables

In the **Environment** tab, add these variables:

### Required Variables
```
NODE_ENV=production
PORT=4000
JWT_SECRET=<generate-random-string>
JWT_REFRESH_SECRET=<generate-random-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=10
```

### Payment Gateways
```
FLUTTERWAVE_SECRET_KEY=<your-key>
FLUTTERWAVE_PUBLIC_KEY=<your-key>
FLUTTERWAVE_WEBHOOK_SECRET=<your-secret>
```

### VTU Service
```
CLUBKONNECT_USERID=CK101266657
CLUBKONNECT_APIKEY=<your-key>
CLUBKONNECT_BASE_URL=https://www.nellobytesystems.com
```

### Crypto Payments
```
NOWPAYMENTS_API_KEY=<your-key>
NOWPAYMENTS_IPN_SECRET=<your-secret>
NOWPAYMENTS_BASE_URL=https://api.nowpayments.io/v1
NOWPAYMENTS_SANDBOX=false
```

### App Configuration
```
APP_NAME=Lordmoon
ADMIN_EMAIL=admin@lordmoon.com
ADMIN_ACCESS_KEY=<generate-random-string>
DEFAULT_CURRENCY=NGN
SUPPORTED_CURRENCIES=NGN,USD
DEPOSIT_FEE=3
WITHDRAWAL_FEE=3
TRANSACTION_FEE=3
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 8: Set URLs (After First Deploy)

After deployment, Render gives you a URL like: `https://lordmoon-backend.onrender.com`

Add these variables:
```
APP_URL=https://lordmoon-backend.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
```

## Step 9: Deploy

Click **"Create Web Service"** and Render will:
1. Clone your repo
2. Install dependencies
3. Build your app
4. Run migrations
5. Start your server

## Step 10: Update Frontend

Update `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://lordmoon-backend.onrender.com
```

Redeploy frontend:
```bash
cd web
vercel --prod
```

## Important Notes

### Free Tier Limitations
- **Spins down after 15 minutes** of inactivity
- **First request after sleep** takes ~30 seconds to wake up
- **750 hours/month** (enough for testing)

### To Keep It Awake (Optional)
Use a service like:
- UptimeRobot (free)
- Cron-job.org (free)

Ping your `/health` endpoint every 10 minutes.

### Upgrade to Paid ($7/month)
- No spin-down
- Faster performance
- More resources

## Troubleshooting

### Build Fails
Check logs in Render dashboard:
1. Click on your service
2. Go to **"Logs"** tab
3. Look for errors

### Database Connection Issues
Make sure:
1. DATABASE_URL is set correctly
2. Using Internal Database URL (not External)
3. Prisma migrations ran successfully

### Environment Variables
Double-check all required variables are set in the Environment tab.

## Useful Commands

### View Logs
In Render dashboard → Your Service → Logs

### Manual Deploy
In Render dashboard → Your Service → Manual Deploy → Deploy latest commit

### Shell Access
In Render dashboard → Your Service → Shell (paid plans only)

## Cost Estimate

- **Free Plan**: $0/month (with limitations)
- **Starter Plan**: $7/month (no spin-down, better performance)
- **PostgreSQL**: Free (1GB storage)

## Next Steps

1. Deploy backend on Render
2. Get your Render URL
3. Update frontend environment variables
4. Redeploy frontend on Vercel
5. Test login/register functionality
