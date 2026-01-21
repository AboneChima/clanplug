-- Fix users with NULL or empty firstName/lastName
-- This will set default values for users showing as "undefined"

-- Update users with NULL firstName
UPDATE users 
SET "firstName" = 'User'
WHERE "firstName" IS NULL OR "firstName" = '';

-- Update users with NULL lastName  
UPDATE users
SET "lastName" = CONCAT('', SUBSTRING("id", 1, 4))
WHERE "lastName" IS NULL OR "lastName" = '';

-- Check for users that might still have issues
SELECT 
  id,
  username,
  "firstName",
  "lastName",
  email
FROM users
WHERE "firstName" IS NULL 
   OR "firstName" = ''
   OR "lastName" IS NULL
   OR "lastName" = '';

-- Optional: Update specific user if you know their username
-- UPDATE users 
-- SET "firstName" = 'Lithe', "lastName" = 'User'
-- WHERE username = 'lithe';
