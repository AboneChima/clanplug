-- Verify users with badge for 5 years
-- Run this in your Render PostgreSQL database

-- For Franklynnnamdi136@gmail.com
INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  u.id,
  'active',
  NOW(),
  NOW() + INTERVAL '5 years',
  NOW(),
  NOW()
FROM users u
WHERE LOWER(u.email) = 'franklynnnamdi136@gmail.com'
ON CONFLICT ("userId") 
DO UPDATE SET
  status = 'active',
  "purchasedAt" = NOW(),
  "expiresAt" = NOW() + INTERVAL '5 years',
  "updatedAt" = NOW();

-- For abonejoseph@gmail.com
INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  u.id,
  'active',
  NOW(),
  NOW() + INTERVAL '5 years',
  NOW(),
  NOW()
FROM users u
WHERE LOWER(u.email) = 'abonejoseph@gmail.com'
ON CONFLICT ("userId") 
DO UPDATE SET
  status = 'active',
  "purchasedAt" = NOW(),
  "expiresAt" = NOW() + INTERVAL '5 years',
  "updatedAt" = NOW();

-- Verify the badges were created
SELECT 
  u.email,
  u.username,
  u."firstName",
  u."lastName",
  vb.status,
  vb."expiresAt"
FROM users u
JOIN verification_badges vb ON vb."userId" = u.id
WHERE LOWER(u.email) IN ('franklynnnamdi136@gmail.com', 'abonejoseph@gmail.com');
