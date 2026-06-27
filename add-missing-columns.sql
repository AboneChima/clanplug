-- Add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "usernameChangedAt" TIMESTAMP(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailChangedAt" TIMESTAMP(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fcmTokens" TEXT[] DEFAULT '{}';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('usernameChangedAt', 'emailChangedAt', 'fcmTokens');
