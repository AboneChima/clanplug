-- Add missing columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "soldToId" TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "listingId" TEXT;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_soldToId_fkey'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_soldToId_fkey 
    FOREIGN KEY ("soldToId") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_listingId_fkey'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_listingId_fkey 
    FOREIGN KEY ("listingId") REFERENCES listings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS posts_soldToId_idx ON posts("soldToId");
CREATE INDEX IF NOT EXISTS posts_listingId_idx ON posts("listingId");

-- Verify the columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name IN ('soldToId', 'listingId');
