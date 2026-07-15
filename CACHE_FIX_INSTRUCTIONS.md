# CDN Cache Issue - Quick Fix Instructions

## Why the URL with parameters works but not the main domain?

**The Problem:**
- When you visit `www.clanplug.site`, Vercel's CDN edge servers return OLD cached HTML
- When you visit `www.clanplug.site?v=timestamp`, it's treated as a **different URL**, so CDN fetches fresh HTML
- The CDN cache is "stuck" on the main domain until it expires or is manually purged

## Solution 1: Force CDN Purge (FASTEST - 2 minutes)

### Step-by-step:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/oracles-projects-0d30db20/web/deployments

2. **Find Latest Deployment:**
   - Click on the **topmost deployment** (most recent)

3. **Redeploy with Cache Purge:**
   - Click the **three dots (...)** button in top-right
   - Select **"Redeploy"**
   - **IMPORTANT:** Make sure "Use existing Build Cache" is **UNCHECKED** (OFF)
   - Click **"Redeploy"**

4. **Wait 2-3 minutes** for deployment to complete

5. **Test:**
   - Clear your browser cache (Ctrl+Shift+Delete → Clear cached images/files)
   - Visit `www.clanplug.site/user/YOUR_USER_ID`
   - Video thumbnails should now show purple/blue gradient boxes

---

## Solution 2: Wait for Natural Cache Expiry

Vercel's CDN cache typically expires in **24-48 hours**. After this time, the cache will automatically refresh.

### How to check if cache has expired:

1. Visit your profile page: `www.clanplug.site/user/YOUR_USER_ID`
2. Open Browser DevTools (F12)
3. Go to **Network** tab
4. Refresh the page
5. Click on the first request (the HTML document)
6. Check **Response Headers**:
   - `x-vercel-cache: MISS` ✅ (cache expired, fresh content)
   - `x-vercel-cache: HIT` ❌ (still cached)
   - `age: 0` ✅ (fresh content)
   - `age: 86400` ❌ (cached for 24 hours)

---

## Solution 3: Use Direct Vercel URL (Temporary)

While waiting for cache to clear, use the direct Vercel URL which is always fresh:

```
https://web-8uaumvrzf-oracles-projects-0d30db20.vercel.app/user/YOUR_USER_ID
```

This URL bypasses the custom domain CDN and always serves fresh content.

---

## What We've Already Done

✅ **Backend fixes:**
- Fixed `getPosts` error handling
- Added `videoThumbnails` support
- Restarted backend on VPS

✅ **Frontend fixes:**
- Changed video thumbnails to purple/blue gradient with play icon
- Added aggressive no-cache headers
- Added middleware to prevent caching
- Added client-side cache bust with URL parameters

✅ **Deployment:**
- Latest code is deployed to Vercel
- Direct Vercel URLs work perfectly
- Only `www.clanplug.site` domain has stale CDN cache

---

## The Root Cause

Vercel's CDN has **multiple cache layers**:

1. **Edge Cache** (closest to users) - This is stuck with old HTML
2. **Regional Cache** - May also have old content
3. **Origin** (your Next.js app) - Has latest code ✅

When you visit with `?v=timestamp`, it creates a new cache entry, so it fetches from origin (fresh).
When you visit without parameters, it returns the stuck edge cache (stale).

The only way to clear the edge cache for the domain is:
1. Manual redeploy (Solution 1) - **FASTEST**
2. Wait for natural expiry (Solution 2) - 24-48 hours
3. Contact Vercel support to manually purge - 1-2 business days

---

## Recommended Action

**Do Solution 1 now** (Force Redeploy) - it takes only 2 minutes and will immediately fix the issue for all users.
