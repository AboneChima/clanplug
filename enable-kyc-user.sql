-- Enable KYC and email verification for abonejoseph@gmail.com
UPDATE "User" 
SET 
  "isKYCVerified" = true,
  "emailVerified" = true
WHERE email = 'abonejoseph@gmail.com';

-- Verify the update
SELECT id, email, username, "isKYCVerified", "emailVerified" 
FROM "User" 
WHERE email = 'abonejoseph@gmail.com';
