# Continue: Post Detail Page Update

## URGENT TASK
Update `/post/[id]` page to match feed design EXACTLY

## Current Status
✅ Feed page (`/feed`) is PERFECT - use as template
❌ Post detail page needs complete redesign

## File to Update
`web/src/app/post/[id]/page.tsx`

## Quick Implementation
1. Copy entire feed page structure
2. Change: `const [posts, setPosts]` → `const [post, setPost]`
3. Change: `posts.map()` → single post rendering
4. Add: `const params = useParams()` and `const router = useRouter()`
5. Add: Back button in top-left
6. Remove: Scroll container, snap logic, tab switching
7. Keep: ALL visual design, positioning, video controls, modals

## Key Design Values (DO NOT CHANGE)
```
Timeline: bottom: 70px
Name: bottom: 180px  
Buttons: bottom: 270px
Comments: z-[200], top-[120px] to bottom-0
More: z-[200], h-[50vh]
```

## Action
Copy `web/src/app/feed/page.tsx` structure completely.
Only modify data fetching logic.

