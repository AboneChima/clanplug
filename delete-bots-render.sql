-- Delete bot followers from Render database
-- Run this with: render psql dpg-d4b12124d50c73cv58bg-a < delete-bots-render.sql

-- First, check for bot users
SELECT id, username, email, "firstName", "lastName" 
FROM "User" 
WHERE 
  username ILIKE '%bot%' OR 
  email ILIKE '%bot%' OR 
  "firstName" ILIKE '%bot%' OR 
  "lastName" ILIKE '%bot%'
LIMIT 20;

-- Delete follow relationships involving bot users
DELETE FROM "Follow"
WHERE "followerId" IN (
  SELECT id FROM "User" 
  WHERE 
    username ILIKE '%bot%' OR 
    email ILIKE '%bot%' OR 
    "firstName" ILIKE '%bot%' OR 
    "lastName" ILIKE '%bot%'
)
OR "followingId" IN (
  SELECT id FROM "User" 
  WHERE 
    username ILIKE '%bot%' OR 
    email ILIKE '%bot%' OR 
    "firstName" ILIKE '%bot%' OR 
    "lastName" ILIKE '%bot%'
);

-- Delete the bot users themselves
DELETE FROM "User"
WHERE 
  username ILIKE '%bot%' OR 
  email ILIKE '%bot%' OR 
  "firstName" ILIKE '%bot%' OR 
  "lastName" ILIKE '%bot%';

-- Show results
SELECT COUNT(*) as remaining_users FROM "User";
