# Trigger Render Deployment

## Option 1: Via Render Dashboard
1. Go to https://dashboard.render.com
2. Find your service: `clanplug-o7rp` (srv-d4b146re5dus73f7ff6g)
3. Click "Manual Deploy" → "Deploy latest commit"

## Option 2: Via Render API (if you have API key)
```bash
curl -X POST \
  https://api.render.com/v1/services/srv-d4b146re5dus73f7ff6g/deploys \
  -H "Authorization: Bearer YOUR_RENDER_API_KEY" \
  -H "Content-Type: application/json"
```

## Option 3: Push an empty commit to trigger auto-deploy
```bash
git commit --allow-empty -m "trigger: force Render redeploy"
git push origin main
```

## Check Deployment Status
- Dashboard: https://dashboard.render.com/web/srv-d4b146re5dus73f7ff6g
- Service URL: https://clanplug-o7rp.onrender.com
- Health Check: https://clanplug-o7rp.onrender.com/health

## What the Backend Does Now:
When a user creates a marketplace listing, the backend automatically:
1. Creates the listing in the database
2. Creates a social post with:
   - Type: MARKETPLACE_LISTING
   - Links to listing via listingId
   - Shows first image, title, price
   - Appears in everyone's feed

## Testing:
1. Create a new marketplace listing
2. Check the social feed - should see the listing post
3. Click "View Listing" - should go to marketplace page
