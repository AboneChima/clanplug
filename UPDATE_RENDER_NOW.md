# 🚨 UPDATE RENDER START COMMAND NOW

## The Problem
Render is still using the OLD start command that doesn't fix the migration.

**Current command (in logs):**
```
npx prisma migrate deploy && npm start
```

This is why it keeps failing!

## The Solution - Update Start Command

### Step-by-Step:

1. **Go to Render Dashboard**
   - https://dashboard.render.com

2. **Select Your Web Service**
   - Click on your backend service (lordmoon-backend or similar)

3. **Go to Settings**
   - Click "Settings" in the left sidebar

4. **Scroll to "Build & Deploy"**
   - Find the "Start Command" field

5. **Change Start Command**
   
   **FROM:**
   ```
   npx prisma migrate deploy && npm start
   ```
   
   **TO:**
   ```
   npm run migrate:safe && npm start
   ```

6. **Save Changes**
   - Click "Save Changes" button at the bottom

7. **Manual Deploy**
   - Go back to your service dashboard
   - Click "Manual Deploy" dropdown
   - Select "Deploy latest commit"

## What Will Happen

After you update and redeploy, the logs will show:

```
==> Running 'npm run migrate:safe && npm start'

> lordmoon-backend@1.0.0 migrate:safe
> npm run fix-migration && npx prisma migrate deploy

🔧 Checking for failed migrations...
❌ Found failed migration: add_verification_badge
🧹 Cleaning up...
✅ Deleted failed migration record
✅ Dropped VerificationBadge table if it existed
✅ Migration cleanup complete!

Prisma schema loaded from prisma/schema.prisma
11 migrations found in prisma/migrations
✅ All migrations applied successfully
✅ Build successful 🎉

> lordmoon-backend@1.0.0 start
> node dist/server.js

Server running on port 3000
```

## Why This Is Important

The script `npm run migrate:safe` does:
1. Run `fix-migration.js` to clean up the failed migration
2. Then run `prisma migrate deploy` to apply migrations
3. Then start the server

Without updating the start command, Render will keep failing!

---

**DO THIS NOW:** Update the start command in Render dashboard and redeploy.
