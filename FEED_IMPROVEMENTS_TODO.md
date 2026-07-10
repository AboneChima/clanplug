# ClanPlug Feed Improvements - Implementation Plan

## Issues to Fix:

### 1. Video Thumbnail on Own Profile ✓
**Issue:** When users view their own profile, video posts show black/no thumbnail in the grid
**Solution:** The code is correct - likely a browser caching issue. Will add poster attribute as fallback.

### 2. Auto-Play Videos in Feed (Instagram-style) 🔥 PRIORITY
**Issue:** Videos in feed show black screen until clicked
**Current:** Videos require click to play
**Desired:** Auto-play when scrolled into view (like Instagram/TikTok)
**Implementation:**
- Add Intersection Observer to detect when video is in viewport
- Auto-play when 50%+ visible
- Auto-pause when scrolled away
- Mute by default, tap to unmute
- Add subtle speaker icon to show mute state

### 3. Maintain Scroll Position 🔥 PRIORITY
**Issue:** When opening a video post and going back, feed refreshes and loses position
**Solution:** 
- Use Next.js router state to preserve scroll position
- Store feed state in sessionStorage
- Restore position on navigation back

### 4. Add to Home Screen in Menu
**Issue:** Banner disappears after dismissal, no way to install later
**Solution:**
- Add "Install App" option in user menu/settings
- Always show for non-installed users

### 5. Watermark for Downloads 🔥 PRIORITY
**Issue:** Downloaded videos/images have no attribution
**Solution:**
- Add "ClanPlug" watermark (bottom-right corner)
- Semi-transparent, modern design
- Apply when user downloads/shares content
- Use Canvas API for images, video overlay for videos

### 6. KYC Images in Admin Panel
**Issue:** KYC verification images don't show in admin
**Solution:**
- Check image URL construction
- Ensure Supabase URLs are correct
- Add fallback if image fails to load

## Priority Order:
1. Auto-play videos (biggest UX improvement)
2. Maintain scroll position (critical for user experience)
3. Watermark system (brand protection)
4. Install app in menu (accessibility)
5. Video thumbnail fix (minor - likely caching)
6. KYC admin images (admin-only issue)

## Files to Modify:
- `web/src/app/feed/page.tsx` - Auto-play, scroll position
- `web/src/app/user/[id]/page.tsx` - Video thumbnail
- `web/src/components/Sidebar.tsx` or Menu - Install app button
- `web/src/app/post/[id]/page.tsx` - Watermark download
- Admin KYC panel - Image URLs

## Technical Approach:

### Auto-Play Videos:
```typescript
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.5 });
  
  // Observe all videos
}, []);
```

### Watermark:
```typescript
const addWatermark = (mediaUrl, type: 'image' | 'video') => {
  // Canvas for images, video overlay for videos
  // "ClanPlug" text in bottom-right, 30% opacity
};
```

### Scroll Restoration:
```typescript
// Save before navigation
sessionStorage.setItem('feedScrollPos', window.scrollY);

// Restore on mount
useEffect(() => {
  const pos = sessionStorage.getItem('feedScrollPos');
  if (pos) window.scrollTo(0, parseInt(pos));
}, []);
```
