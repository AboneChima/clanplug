-- FIX ALL VERIFICATION BADGES
-- Run this in Render database to fix everything

-- 1. Update all existing badges to use 'verified' status instead of 'active'
UPDATE verification_badges 
SET status = 'verified' 
WHERE status = 'active';

-- 2. Check current verifications
SELECT 
    u.username,
    u.email,
    vb.status,
    vb."expiresAt",
    EXTRACT(DAY FROM (vb."expiresAt" - NOW())) as days_remaining
FROM users u
INNER JOIN verification_badges vb ON vb."userId" = u.id
ORDER BY u.username;

-- 3. If you want to verify specific users for 60 days, run:
-- Replace 'username@email.com' with actual email

-- Example: Verify Natashanice8717@gmail.com for 60 days
INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    id,
    'verified',
    NOW(),
    NOW() + INTERVAL '60 days',
    NOW(),
    NOW()
FROM users 
WHERE LOWER(email) = 'natashanice8717@gmail.com'
ON CONFLICT ("userId") 
DO UPDATE SET
    status = 'verified',
    "purchasedAt" = NOW(),
    "expiresAt" = NOW() + INTERVAL '60 days',
    "updatedAt" = NOW();
