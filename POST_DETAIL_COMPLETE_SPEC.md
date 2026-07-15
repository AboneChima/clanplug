# Post Detail Page - Complete Implementation Spec

## Status
Feed page is 100% working. Need to copy exact same design to post detail page.

## Implementation Strategy
Copy `web/src/app/feed/page.tsx` and modify for single post:

### Changes Required:
1. Replace `posts` array with single `post` state
2. Remove scroll container and snap logic  
3. Remove `searchParams` and tab switching
4. Add back button (top-left with IoArrowBackOutline)
5. Fetch single post by `params.id`
6. Keep ALL visual design identical

### What to Keep Exactly Same:
- All video controls and tap-to-play
- Custom progress bar at `70px` from bottom
- User info at `180px` from bottom
- Action buttons at `270px` from bottom
- Comments modal (solid black, z-[200], full height)
- More menu (50vh, small icons)
- Bottom menu auto-hide
- All state management for video/comments/more

## Next Steps
1. Copy feed page to post detail
2. Replace array logic with single post
3. Add useParams for post ID
4. Add back button
5. Test all interactions
6. Deploy

## File Location
`web/src/app/post/[id]/page.tsx`

