-- Delete KYC submission for mainoracle10@gmail.com
-- This will allow the user to submit KYC again

-- First, find the user ID
-- SELECT id, email, firstName, lastName FROM "User" WHERE email = 'mainoracle10@gmail.com';

-- Delete KYC verification records for this user
DELETE FROM "KYCVerification" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'mainoracle10@gmail.com'
);

-- Verify deletion
SELECT 
  u.id,
  u.email,
  u.firstName,
  u.lastName,
  u."isKYCVerified",
  COUNT(k.id) as kyc_count
FROM "User" u
LEFT JOIN "KYCVerification" k ON k."userId" = u.id
WHERE u.email = 'mainoracle10@gmail.com'
GROUP BY u.id, u.email, u.firstName, u.lastName, u."isKYCVerified";
