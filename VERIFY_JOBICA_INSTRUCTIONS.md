# How to Verify @Jobica (jobicafoods@gmail.com)

## ✅ The script is ready: `activate-kyc-jobica.js`

Since you successfully verified @Deoracle before, you can use the same method for @Jobica.

## Method 1: Add as a Build/Deploy Command (EASIEST - No Shell Needed!)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service**: `clanplug` (srv-d4b146re5dus73f7ff6g)
3. **Go to Settings**
4. **Scroll to "Build & Deploy"**
5. **Add a "Deploy Hook"** or modify the build command temporarily:
   
   **Current Build Command**: `npm run build`
   
   **Temporary Build Command**:
   ```bash
   npm run build && node activate-kyc-jobica.js
   ```

6. **Click "Save Changes"**
7. **Trigger a manual deploy** (click "Manual Deploy" → "Deploy latest commit")
8. **Check the logs** - you'll see the verification output
9. **Revert the build command** back to just `npm run build`

## Method 2: Use Render's One-off Job

1. Go to your Render service
2. Look for "Jobs" or "One-off Jobs" section
3. Create a new job with command: `node activate-kyc-jobica.js`
4. Run the job
5. Check logs for success message

## Method 3: SSH/Shell Access (Requires Upgrade)

If you upgrade to a paid plan, you can use the shell directly:
```bash
node activate-kyc-jobica.js
```

## What the Script Does

The script will:
1. Search for user by email: `jobicafoods@gmail.com`
2. Search for user by username: `Jobica`
3. Set `isKYCVerified` to `true`
4. Set `status` to `ACTIVE`
5. Show success message

## Expected Output

```
🔍 Looking for user: jobicafoods@gmail.com / Jobica...
✅ Found user: {
  id: '...',
  email: 'jobicafoods@gmail.com',
  username: 'Jobica',
  currentKYC: false
}
🔄 Activating KYC...
✅ KYC ACTIVATED!
Updated user: {
  id: '...',
  email: 'jobicafoods@gmail.com',
  username: 'Jobica',
  isKYCVerified: true,
  status: 'ACTIVE'
}

🎉 SUCCESS! @Jobica can now:
  ✅ See verified badge next to their name
  ✅ Create marketplace listings
  ✅ Like posts
  ✅ Follow users
  ✅ Comment on posts
  ✅ All features unlocked!
```

## Alternative: Manual Database Update

If you have a database client (like pgAdmin, DBeaver, or psql), you can connect directly:

**Connection String**:
```
postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon
```

**SQL Query**:
```sql
UPDATE users 
SET "isKYCVerified" = true, 
    status = 'ACTIVE' 
WHERE email = 'jobicafoods@gmail.com' 
   OR username = 'Jobica';
```

## Verification

After running the script, check the app:
1. Go to https://clanplug.vercel.app
2. Find @Jobica's posts in the feed
3. You should see a blue verified badge ✓ next to their name

---

**Note**: The script is already pushed to GitHub, so it's available on your Render service!
