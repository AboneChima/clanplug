-- Refund for abonejoseph@gmail.com
-- Run this on your Render PostgreSQL database

BEGIN;

-- Find and refund all test purchases for this user
WITH user_info AS (
  SELECT id, username, email 
  FROM users 
  WHERE email = 'abonejoseph@gmail.com'
),
escrows_to_refund AS (
  SELECT 
    e.id as escrow_id,
    e.amount,
    e.fee,
    e.currency,
    e."buyerId",
    e."postId",
    (e.amount + e.fee) as total_refund
  FROM escrows e
  JOIN user_info u ON e."buyerId" = u.id
  WHERE e.status IN ('FUNDED', 'PENDING')
)
-- Refund money to wallet
UPDATE wallets w
SET balance = balance + etr.total_refund,
    "updatedAt" = NOW()
FROM escrows_to_refund etr
WHERE w."userId" = etr."buyerId"
  AND w.currency = etr.currency;

-- Mark escrows as refunded
UPDATE escrows e
SET status = 'REFUNDED',
    "updatedAt" = NOW()
FROM user_info u
WHERE e."buyerId" = u.id
  AND e.status IN ('FUNDED', 'PENDING');

-- Mark posts as active again
UPDATE posts p
SET status = 'ACTIVE',
    "soldToId" = NULL,
    "soldAt" = NULL,
    "updatedAt" = NOW()
FROM escrows e
JOIN user_info u ON e."buyerId" = u.id
WHERE p.id = e."postId"
  AND e.status = 'REFUNDED';

-- Create notification
INSERT INTO notifications ("userId", type, title, message, "createdAt")
SELECT 
  u.id,
  'ESCROW_UPDATE',
  '💰 Test Purchase Refunded',
  'Your test purchases have been refunded. Check your wallet.',
  NOW()
FROM user_info u;

-- Show summary
SELECT 
  u.username,
  u.email,
  COUNT(e.id) as refunded_count,
  SUM(e.amount + e.fee) as total_refunded,
  e.currency
FROM user_info u
LEFT JOIN escrows e ON e."buyerId" = u.id AND e.status = 'REFUNDED'
GROUP BY u.username, u.email, e.currency;

COMMIT;

-- Verify wallet balance after refund
SELECT 
  u.username,
  u.email,
  w.balance,
  w.currency
FROM users u
JOIN wallets w ON w."userId" = u.id
WHERE u.email = 'abonejoseph@gmail.com';
