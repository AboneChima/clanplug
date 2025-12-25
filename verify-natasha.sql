-- Verify Natashanice8717@gmail.com for 60 days

-- First, find the user
SELECT id, username, email FROM users WHERE LOWER(email) = 'natashanice8717@gmail.com';

-- Update or insert verification badge (expires in 60 days)
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

-- Create notification
INSERT INTO notifications (id, "userId", type, title, message, "isRead", "createdAt")
SELECT 
    gen_random_uuid(),
    id,
    'SYSTEM',
    '✅ Verification Badge Activated!',
    'Congratulations! Your verification badge is now active for 60 days.',
    false,
    NOW()
FROM users 
WHERE LOWER(email) = 'natashanice8717@gmail.com';

-- Verify the update
SELECT 
    u.username,
    u.email,
    vb.status,
    vb."purchasedAt",
    vb."expiresAt"
FROM users u
LEFT JOIN verification_badges vb ON vb."userId" = u.id
WHERE LOWER(u.email) = 'natashanice8717@gmail.com';
