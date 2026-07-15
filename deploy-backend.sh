#!/bin/bash

# Group Chat Feature - Backend Deployment Script
# Run this on your VPS after uploading the code

echo "🚀 Deploying Group Chat Feature - Backend"
echo "=========================================="

# Step 1: Install dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

# Step 2: Generate Prisma Client
echo ""
echo "⚙️  Step 2: Generating Prisma Client..."
npx prisma generate

# Step 3: Build TypeScript
echo ""
echo "🔨 Step 3: Building TypeScript..."
npx tsc

# Step 4: Create sample groups (only if they don't exist)
echo ""
echo "👥 Step 4: Creating sample groups..."
node create-sample-groups.js

# Step 5: Restart the server
echo ""
echo "🔄 Step 5: Restarting server..."
pm2 restart all || npm run start

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check server logs: pm2 logs"
echo "2. Test groups endpoint: curl https://api.clanplug.site/api/groups -H 'Authorization: Bearer TOKEN'"
echo "3. Deploy frontend: cd web && vercel --prod"
