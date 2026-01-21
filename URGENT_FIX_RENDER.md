# 🚨 URGENT: Add Supabase Variables to Render NOW

## Error: "supabaseUrl is required"

Your backend is crashing because Supabase environment variables are missing in Render.

---

## ⚡ FIX IT NOW (2 minutes)

### 👉 [CLICK HERE: Open Render Dashboard](https://dashboard.render.com/)

### Steps:

1. **Find your backend service** (clanplug or lordmoon-backend)

2. **Click on "Environment" tab** (left sidebar)

3. **Click "Add Environment Variable"** button

4. **Add these 3 variables ONE BY ONE:**

**Variable 1:**
```
Key: SUPABASE_URL
Value: https://htfnwvaqrhzcoybphiqk.supabase.co
```
Click "Save"

**Variable 2:**
```
Key: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Zm53dmFxcmh6Y295YnBoaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk4MTA1NiwiZXhwIjoyMDc4NTU3MDU2fQ.hAdBVtkMcjAu-ZzWHPfuzDcPU-pVNgV-sEJHEGAemug
```
Click "Save"

**Variable 3:**
```
Key: SUPABASE_BUCKET
Value: uploads
```
Click "Save"

5. **Service will auto-redeploy** (wait 2-3 minutes)

6. **Check logs** - should see "Server running on port 4000" ✅

---

## ✅ After Adding Variables

Your backend will restart automatically and the error will be gone!

Then you can proceed with:
- Creating the Supabase bucket
- Testing uploads

---

## 🔍 How to Verify It's Fixed

After adding variables and redeployment:
- Go to Render logs
- You should see: `✅ Server running on port 4000`
- No more "supabaseUrl is required" error

---

**Do this now, then continue with bucket creation!** 🚀
