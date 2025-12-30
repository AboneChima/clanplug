-- Delete bot followers SQL script
-- Run this on your production database

-- First, find bot users
SELECT id, username, email, "firstName", "lastName" 
FROM "User" 
WHERE 
  username ILIKE '%bot%' OR 
  email ILIKE '%bot%' OR 
  "firstName" ILIKE '%bot%' OR 
  "lastName" ILIKE '%bot%';

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

-- Optionally delete the bot users themselves
DELETE FROM "User"
WHERE 
  username ILIKE '%bot%' OR 
  email ILIKE '%bot%' OR 
  "firstName" ILIKE '%bot%' OR 
  "lastName" ILIKE '%bot%';
