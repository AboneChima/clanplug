-- Fix failed migration in production database
-- Run this directly in your Render PostgreSQL database

-- Step 1: Mark the failed migration as rolled back
DELETE FROM "_prisma_migrations" WHERE migration_name = 'add_verification_badge';

-- Step 2: Check if VerificationBadge table exists, if so drop it
DROP TABLE IF EXISTS "VerificationBadge" CASCADE;

-- Step 3: Now the migration can run fresh
-- After running this, redeploy on Render and migrations will work
