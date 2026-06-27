-- Rename tables to match Prisma schema expectations
ALTER TABLE IF EXISTS "VerificationBadge" RENAME TO "verification_badges";
ALTER TABLE IF EXISTS "Listing" RENAME TO "listings";
ALTER TABLE IF EXISTS "Purchase" RENAME TO "purchases";

-- Verify the tables were renamed
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('verification_badges', 'listings', 'purchases');
