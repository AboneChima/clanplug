# Push Bookmark Table to Production Database

## Issue
The Bookmark table exists in the Prisma schema but may not exist in the production database on Render.

## Solution
Run this command to push the schema to production:

```bash
npx prisma db push
```

This will:
1. Connect to the production database (using DATABASE_URL from .env on Render)
2. Create the `bookmarks` table if it doesn't exist
3. Apply any schema changes

## On Render Dashboard

1. Go to your backend service on Render
2. Go to "Shell" tab
3. Run: `npx prisma db push`
4. Confirm the changes

## Alternative: Run Migration

If you prefer migrations:

```bash
npx prisma migrate deploy
```

## Verify It Worked

After pushing, the bookmarks should persist correctly. Test by:
1. Adding a post to favorites
2. Refreshing the page
3. Check if it's still in the Favorites tab

## Current Schema

The Bookmark model in `prisma/schema.prisma`:

```prisma
model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, postId])
  @@map("bookmarks")
}
```

This creates a many-to-many relationship between Users and Posts for bookmarking.
