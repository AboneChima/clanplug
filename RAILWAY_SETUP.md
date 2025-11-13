# Railway Deployment Guide

## Step 1: Install Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# Or use npm
npm install -g @railway/cli
```

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

## Step 3: Initialize Railway Project

```bash
# In your project root
railway init
```

Select "Create new project" and give it a name (e.g., "lordmoon-backend")

## Step 4: Add PostgreSQL Database

```bash
railway add --database postgres
```

This creates a PostgreSQL database and automatically sets DATABASE_URL.

## Step 5: Add Redis (Optional but Recommended)

```bash
railway add --database redis
```

This creates a Redis instance and sets REDIS_URL.

## Step 6: Set Environment Variables

```bash
# Set all your environment variables
railway variables set JWT_SECRET="your-jwt-secret-here"
railway variables set JWT_REFRESH_SECRET="your-refresh-secret-here"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set JWT_REFRESH_EXPIRES_IN="30d"
railway variables set NODE_ENV="production"
railway variables set PORT="4000"
railway variables set BCRYPT_ROUNDS="10"

# Payment gateways
railway variables set FLUTTERWAVE_SECRET_KEY="your-key"
railway variables set FLUTTERWAVE_PUBLIC_KEY="your-key"
railway variables set FLUTTERWAVE_WEBHOOK_SECRET="your-secret"

# VTU Service
railway variables set CLUBKONNECT_USERID="CK101266657"
railway variables set CLUBKONNECT_APIKEY="your-api-key"
railway variables set CLUBKONNECT_BASE_URL="https://www.nellobytesystems.com"

# Crypto payments
railway variables set NOWPAYMENTS_API_KEY="your-key"
railway variables set NOWPAYMENTS_IPN_SECRET="your-secret"
railway variables set NOWPAYMENTS_BASE_URL="https://api.nowpayments.io/v1"
railway variables set NOWPAYMENTS_SANDBOX="false"

# App configuration
railway variables set APP_NAME="Lordmoon"
railway variables set ADMIN_EMAIL="admin@lordmoon.com"
railway variables set ADMIN_ACCESS_KEY="your-admin-key"
railway variables set DEFAULT_CURRENCY="NGN"
railway variables set SUPPORTED_CURRENCIES="NGN,USD"
railway variables set DEPOSIT_FEE="3"
railway variables set WITHDRAWAL_FEE="3"
railway variables set TRANSACTION_FEE="3"

# Email (if configured)
railway variables set EMAIL_HOST="smtp.gmail.com"
railway variables set EMAIL_PORT="587"
railway variables set EMAIL_USER="your-email@gmail.com"
railway variables set EMAIL_PASS="your-app-password"
railway variables set EMAIL_FROM="noreply@lordmoon.com"

# Rate limiting
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"
```

## Step 7: Set Frontend URL (After Deployment)

After your first deployment, Railway will give you a URL. You'll need to set:

```bash
railway variables set APP_URL="https://your-app.railway.app"
railway variables set FRONTEND_URL="https://your-frontend-url.vercel.app"
```

## Step 8: Deploy

```bash
# Link your GitHub repo (recommended)
railway link

# Or deploy directly
railway up
```

## Step 9: Run Database Migrations

```bash
# After first deployment
railway run npx prisma migrate deploy
```

## Step 10: Check Logs

```bash
railway logs
```

## Step 11: Update Frontend

Once deployed, update your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

And redeploy your frontend on Vercel.

## Useful Commands

```bash
# View all environment variables
railway variables

# Open Railway dashboard
railway open

# Connect to database
railway connect postgres

# Run commands in Railway environment
railway run <command>

# View service status
railway status
```

## Cost Estimate

Railway offers:
- **$5/month free credit** (Hobby plan)
- **~$5-10/month** for small apps (PostgreSQL + Redis + Backend)
- **Pay only for what you use** (no fixed plans)

## Troubleshooting

### Database Connection Issues
If you get connection errors, make sure:
1. DATABASE_URL is set automatically by Railway
2. Run `railway variables` to verify

### Build Failures
Check logs with `railway logs` and ensure:
1. All dependencies are in package.json
2. Prisma schema is valid
3. Build command completes successfully

### Port Issues
Railway automatically sets PORT environment variable. Your app should use:
```typescript
const PORT = process.env.PORT || 4000;
```

This is already configured in your `src/server.ts`.
