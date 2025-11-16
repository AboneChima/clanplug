#!/bin/bash
# Quick fix for Render migration error
# Run this script to connect to your Render database and fix the migration

echo "🔧 Render Migration Fix Script"
echo "================================"
echo ""
echo "This script will help you fix the P3009 migration error on Render."
echo ""
echo "📋 Steps:"
echo "1. Get your database connection string from Render dashboard"
echo "2. Run the SQL commands below"
echo "3. Redeploy your service"
echo ""
echo "🔗 Get connection string:"
echo "   https://dashboard.render.com → Your PostgreSQL → Connect → External Connection"
echo ""
echo "💾 SQL Commands to run:"
echo "================================"
cat << 'EOF'

-- Delete the failed migration record
DELETE FROM "_prisma_migrations" WHERE migration_name = 'add_verification_badge';

-- Drop the table if it exists (in case it was partially created)
DROP TABLE IF EXISTS "VerificationBadge" CASCADE;

-- Verify it's gone
SELECT migration_name, finished_at, success FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;

EOF
echo "================================"
echo ""
echo "🚀 After running these commands:"
echo "   1. Go to Render dashboard"
echo "   2. Click 'Manual Deploy' → 'Deploy latest commit'"
echo "   3. Watch logs for success ✅"
echo ""
echo "Need help? Check RENDER_MIGRATION_FIX.md for detailed instructions"
