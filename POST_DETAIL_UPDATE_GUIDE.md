# Post Detail Page Update Guide

## Objective
Make `/post/[id]` page identical to the feed page design

## Approach
Copy the feed page component structure and adapt it for single post view

## Files
- Source: `web/src/app/feed/page.tsx` (working perfectly)
- Target: `web/src/app/post/[id]/page.tsx` (needs update)
- Backup created: `web/src/app/post/[id]/page-old-backup.tsx`

## Key Changes Needed

### 1. Remove Feed-Specific Logic
- Remove post array/scrolling
- Remove snap scroll container
- Keep single post state

### 2. Keep All Feed Design Elements
- ✅ Fullscreen layout (h-screen)
- ✅ Tap-to-play video with custom controls
- ✅ Custom progress bar at 70px from bottom
- ✅ User info at 180px from bottom
- ✅ Action buttons at 270px from bottom (NO backgrounds)
- ✅ Comments slide-up (60% height, solid black, z-[200])
- ✅ More menu (50vh, smaller icons)
- ✅ Bottom menu auto-hide when modals open

### 3. Add Back Button
- Top-left corner with proper z-index
- Navigate back to feed or previous page

### 4. Single Post Fetching
```typescript
const [post, setPost] = useState<Post | null>(null);
const fetchPost = async () => {
  // Fetch single post by ID from params
};
```

## Complete Implementation Steps

1. Import all hooks and components from feed page
2. Change from posts array to single post state
3. Remove scrolling/snap logic
4. Keep all video controls, timeline, positioning
5. Keep comment modal with bottom menu hide
6. Keep more menu with download
7. Add back button
8. Test all interactions

## Design Specs (Same as Feed)
```css
Timeline: bottom: 70px
User Info: bottom: 180px
Action Buttons: bottom: 270px
Comments: top-[120px] to bottom-0, z-[200]
More Menu: h-[50vh], z-[200]
Bottom Menu: Hides when modals open
```

