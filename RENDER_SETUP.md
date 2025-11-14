# Render Environment Variables Setup

## 🚨 CRITICAL: Add These to Render Dashboard

Your backend needs Cloudinary credentials to upload profile pictures.

### Steps:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Select your service: `clanplug` (srv-d4b146re5dus73f7ff6g)

2. **Go to Environment**
   - Click "Environment" in the left sidebar
   - Click "Add Environment Variable"

3. **Add These Variables:**

```
CLOUDINARY_CLOUD_NAME=dj1p6uao1
CLOUDINARY_API_KEY=317165674413637
CLOUDINARY_API_SECRET=BQg7z3LHHJFHFQl4qrKg_o7myTc
```

4. **Save and Redeploy**
   - Click "Save Changes"
   - Render will automatically redeploy

## ✅ What This Fixes:

- ✅ Profile picture uploads
- ✅ Avatar storage in Cloudinary
- ✅ "Cloud storage not configured" error

## 🔄 After Adding Variables:

Wait 2-3 minutes for deployment, then:
1. Refresh your site
2. Try uploading profile picture
3. It should work!

## 📝 Current Status:

- ✅ Backend code fixed
- ✅ Suggested users endpoint added
- ✅ Posts created for your account
- ⏳ Waiting for Cloudinary config on Render
