# Update Render Environment Variables

## URGENT: Fix Email Configuration on Render

Your backend is deployed but emails won't work until you update these environment variables on Render.

### Steps:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service**: `clanplug-o7rp` (or lordmoon-backend)
3. **Click "Environment"** in the left sidebar
4. **Update these variables**:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deoraclee@gmail.com
SMTP_PASS=tivplyipbvlwqeha
SMTP_FROM=deoraclee@gmail.com
SMTP_SECURE=false
```

**IMPORTANT**: 
- Remove ALL spaces from `SMTP_PASS`
- Change `SMTP_FROM` from `noreply@clanplug.com` to `deoraclee@gmail.com`

5. **Click "Save Changes"**
6. Render will automatically redeploy (takes 2-3 minutes)

### Test After Deployment:

```bash
# PowerShell
$body = @{email="your-email@gmail.com"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.clanplug.site/api/password-reset/request" -Method POST -ContentType "application/json" -Body $body
```

Check your email inbox (and spam folder just in case).

---

## What Changed:

### 1. Fixed Email Service
- ✅ Removed spaces from SMTP password
- ✅ Changed sender to match SMTP user (avoids Gmail blocking)
- ✅ Added proper TLS configuration
- ✅ Added timeout settings

### 2. Improved Email Templates
- ✅ Professional HTML design
- ✅ Mobile-responsive
- ✅ Plain text fallback
- ✅ Better headers to avoid spam
- ✅ Clear call-to-action buttons

### 3. Better Error Handling
- ✅ Detailed error logging
- ✅ Message ID tracking
- ✅ Connection timeout handling

---

## Expected Result:

After updating Render environment variables, password reset emails should:
- ✅ Be delivered within 5-10 seconds
- ✅ Land in PRIMARY inbox (not spam)
- ✅ Look professional and branded
- ✅ Work on all email clients (Gmail, Outlook, etc.)

---

**Need help?** Let me know if you have issues accessing Render dashboard!
