# URGENT: Change Domain to Fix Cache Issue (5 Minutes)

## The ONLY Solution That Will Work Right Now

Since Vercel's CDN cache is stuck and won't clear, we need to temporarily use a DIFFERENT domain. A new domain has no cached content, so it will serve the fixed code immediately.

## Steps (5 minutes total):

### 1. In Vercel Dashboard

**Go to:** https://vercel.com/oracles-projects-0d30db20/web/settings/domains

**Add new domain:**
- Click "Add Domain"
- Enter: `app.clanplug.site`
- Click "Add"

### 2. In Your Domain Provider (Where you bought clanplug.site)

**Add DNS Record:**
- Type: `CNAME`
- Name: `app`
- Value: `cname.vercel-dns.com`
- TTL: `3600` (or default)
- Save

### 3. Wait 2-3 Minutes

DNS propagation takes 2-3 minutes.

### 4. Test

Visit: `https://app.clanplug.site/user/cmi2ntvc90000bv5rbc2r5kb0`

The video thumbnails will show the purple/blue gradient immediately because this is a fresh domain with no cache.

### 5. Update Your Links (Optional)

You can:
- Use `app.clanplug.site` going forward, OR
- Keep using `www.clanplug.site` and it will fix itself in 24-48 hours when cache expires

## Alternative: Use Direct Vercel URL Right Now

While waiting for DNS, you can immediately use:

`https://web-ja9kgxb5v-oracles-projects-0d30db20.vercel.app`

This URL has the fix working RIGHT NOW. You can share this with users temporarily.

## Why This Works

```
www.clanplug.site          → CDN has old cache (stuck) ❌
app.clanplug.site          → New domain, no cache ✅
web-xxx.vercel.app         → Direct URL, always fresh ✅
```

---

**FASTEST OPTION:** Just use the direct Vercel URL above for now. It works perfectly and requires zero DNS changes.
