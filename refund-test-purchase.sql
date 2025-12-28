-- Refund Test Purchase Script
-- Run this on your Render database to refund your test purchase

-- 1. Find your recent escrow (replace YOUR_USER_ID with your actual user ID)
SELECT 
  e.id as escrow_id,
  e.amount,
  e.currency,
  e.status,
  e.title,
  u.username as buyer_username,
  u.email as buyer_email
FROM escrows e
JOIN users u ON e."buyerId" = u.id
WHERE e."buyerId" = 'YOUR_USER_ID'  -- Replace with your user ID
  AND e.status IN ('FUNDED', 'PENDING')
ORDER BY e."createdAt" DESC
LIMIT 5;

-- 2. After confirming the escrow ID, run this to refund:
-- (Replace ESCROW_ID and BUYER_ID with actual values)

BEGIN;

-- Get escrow details
SELECT amount, fee, currency, "buyerId", "postId" 
FROM escrows 
WHERE id = 'ESCROW_ID';

-- Refund money to buyer's wallet
UPDATE wallets
SET balance = balance + (
  SELECT amount + fee 
  FROM escrows 
  WHERE id = 'ESCROW_ID'
)
WHERE "userId" = 'BUYER_ID'
  AND currency = (SELECT currency FROM escrows WHERE id = 'ESCROW_ID');

-- Mark escrow as refunded
UPDATE escrows
SET status = 'REFUNDED',
    "updatedAt" = NOW()
WHERE id = 'ESCROW_ID';

-- Mark post as active again (if exists)
UPDATE posts
SET status = 'ACTIVE',
    "soldToId" = NULL,
    "soldAt" = NULL
WHERE id = (SELECT "postId" FROM escrows WHERE id = 'ESCROW_ID');

-- Create notification
INSERT INTO notifications ("userId", type, title, message, "createdAt")
SELECT 
  "buyerId",
  'ESCROW_UPDATE',
  '💰 Refund Processed',
  'Your test purchase has been refunded. Amount: ' || (amount + fee) || ' ' || currency,
  NOW()
FROM escrows
WHERE id = 'ESCROW_ID';

COMMIT;

-- 3. Verify refund
SELECT 
  w.balance,
  w.currency,
  u.username
FROM wallets w
JOIN users u ON w."userId" = u.id
WHERE w."userId" = 'BUYER_ID';
