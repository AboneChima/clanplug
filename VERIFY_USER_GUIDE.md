# User Verification Guide

## ✅ How to Verify KYC for Users

Since the API endpoint isn't responding yet, you can verify users directly on Render using the shell.

### Method 1: Using Render Shell (RECOMMENDED)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Find your service: `clanplug` (srv-d4b146re5dus73f7ff6g)

2. **Open Shell**
   - Click on your service
   - Go to "Shell" tab
   - Wait for shell to connect

3. **Run the Verification Script**
   ```bash
   node verify-jobicafoods.js
   ```

   This will verify: **jobicafoods@gmail.com**

4. **For Other Users**
   Edit the email in the script:
   ```bash
   # For Franklynnnamdi136@gmail.com
   node activate-kyc-user.js
   ```

### Method 2: Using API (When Available)

Once the deployment is fully propagated, you can use:

```bash
curl -X POST https://clanplug-o7rp.onrender.com/api/admin-temp/activate-kyc-temp \
  -H "Content-Type: application/json" \
  -d '{"email":"jobicafoods@gmail.com","secret":"activate-kyc-2024"}'
```

### Method 3: Direct Database Access

If you have database access:

```javascript
// Connect to PostgreSQL
// postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a/lordmoon

UPDATE users 
SET "isKYCVerified" = true, status = 'ACTIVE' 
WHERE email = 'jobicafoods@gmail.com';
```

## 📝 Users to Verify

1. ✅ Franklynnnamdi136@gmail.com (script: activate-kyc-user.js)
2. ✅ jobicafoods@gmail.com (script: verify-jobicafoods.js)

## 🔧 Troubleshooting

### API Returns 404
- Wait 2-3 minutes for Render to fully deploy
- Check Render logs for any errors
- Verify the service is running at https://clanplug-o7rp.onrender.com/health

### Script Not Found
- Make sure you're in the project root directory
- Run `ls` to see available scripts
- Pull latest code: `git pull origin main`

### Permission Denied
- Make sure you're logged into Render
- Verify you have access to the service
- Check that DATABASE_URL is set correctly

## ✨ Success Indicators

When verification is successful, you'll see:
```
✅ SUCCESS! User verified!
{
  email: 'jobicafoods@gmail.com',
  username: '...',
  isKYCVerified: true,
  status: 'ACTIVE'
}
```

The verified badge will then appear next to the user's name in the app!
