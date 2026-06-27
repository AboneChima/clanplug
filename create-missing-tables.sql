-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "postId"),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS bookmarks_userId_idx ON bookmarks("userId");
CREATE INDEX IF NOT EXISTS bookmarks_postId_idx ON bookmarks("postId");

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "postId"),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS likes_userId_idx ON likes("userId");
CREATE INDEX IF NOT EXISTS likes_postId_idx ON likes("postId");

-- Verify tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('bookmarks', 'likes');
