# Feed Improvements - Next Session Tasks

## Current Status
✅ Feed page (`/feed`) is fully working with TikTok-style design
✅ Floating bottom menu with auto-hide
✅ Comments and More menu properly overlay
✅ Video download working
✅ All positioning fixed

## Tasks for Next Session

### 1. Video Thumbnails on Profile
**Files to update:**
- `web/src/app/profile/page.tsx` - Own profile
- `web/src/app/user/[id]/page.tsx` - Other user profiles

**Requirements:**
- Replace purple placeholder with actual video thumbnail
- Generate thumbnails from video (first frame or use existing thumbnail if stored)
- Show thumbnail in profile grid view

### 2. Post Detail Page - Match FYP Design
**File to update:**
- `web/src/app/post/[id]/page.tsx`

**Requirements:** Make it EXACTLY like `/feed` page:
- ❌ Remove background from action buttons (likes, etc)
- ✅ Add visible timeline for videos
- ✅ Show name and description at bottom (not below content)
- ✅ Make comment section full and scrollable
- ✅ Add tap-to-play/pause functionality
- ✅ Use same layout, positioning, and styling as feed
- ✅ Floating bottom menu (same behavior)
- ✅ Custom progress bar
- ✅ All interactions identical to feed

**Approach:**
- Consider extracting feed post component into reusable component
- Or copy the exact same structure from feed page to post detail page
- Ensure single post view has same UX as feed scroll

### 3. Video Thumbnail Generation
**Backend consideration:**
- Check if thumbnails are already generated (look for `videoThumbnails` column)
- If not, may need to generate on upload or on-demand
- Could use FFmpeg to extract first frame
- Store thumbnail URL in database

## Technical Notes
- Feed page is at: `web/src/app/feed/page.tsx`
- All the feed logic, styling, and interactions are there
- Bottom menu hides when modals open (working correctly)
- Z-index hierarchy: Comments/More(200) > BottomMenu(50)

## Design Specifications
- Name/description position: `180px` from bottom
- Action buttons: `270px` from bottom  
- Timeline: `70px` from bottom
- Comments: Full height from top-120px to bottom-0
- More menu: 50vh height with smaller icons

