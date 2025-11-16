-- Add listingId field to Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "listingId" TEXT;

-- Add MARKETPLACE_LISTING to PostType enum
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'MARKETPLACE_LISTING';

-- Create index for faster listing lookups
CREATE INDEX IF NOT EXISTS "Post_listingId_idx" ON "Post"("listingId");
