-- This SQL adds a unique constraint to prevent duplicate DIRECT chats between the same two users
-- It creates a composite unique index on chat participants for DIRECT chats

-- First, let's create a function to generate a consistent key for chat participants
-- This will be used in the unique constraint

-- For PostgreSQL, we'll add a unique partial index
-- This ensures that for DIRECT chats, there can only be one active chat between two users

-- Step 1: Add a unique constraint at the chat level
-- We'll add a computed column or use a unique index

-- Create a unique index that prevents duplicate DIRECT chats
-- This uses a composite of sorted participant user IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_direct_chat 
ON "ChatParticipant" (
  LEAST(
    (SELECT "userId" FROM "ChatParticipant" cp1 WHERE cp1."chatId" = "ChatParticipant"."chatId" ORDER BY "userId" LIMIT 1),
    (SELECT "userId" FROM "ChatParticipant" cp2 WHERE cp2."chatId" = "ChatParticipant"."chatId" ORDER BY "userId" DESC LIMIT 1)
  ),
  GREATEST(
    (SELECT "userId" FROM "ChatParticipant" cp1 WHERE cp1."chatId" = "ChatParticipant"."chatId" ORDER BY "userId" LIMIT 1),
    (SELECT "userId" FROM "ChatParticipant" cp2 WHERE cp2."chatId" = "ChatParticipant"."chatId" ORDER BY "userId" DESC LIMIT 1)
  )
)
WHERE "isActive" = true 
AND "chatId" IN (SELECT id FROM "Chat" WHERE type = 'DIRECT' AND "isActive" = true);

-- Alternative simpler approach: Create a check in the application layer
-- The deduplication script will clean existing duplicates
-- And we'll add validation in the chat service to prevent creating duplicates
