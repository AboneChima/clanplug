#!/bin/bash

# Deploy Backend to Render
echo "🚀 Deploying Backend to Render..."

# Set production database URL
export DATABASE_URL="postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon"

# Apply database migrations
echo "📦 Applying database migrations..."
npx prisma db push --skip-generate

# Build the backend
echo "🔨 Building backend..."
npm run build

# Commit and push changes
echo "📤 Pushing to Git..."
git add .
git commit -m "feat: auto-create social posts for marketplace listings"
git push origin main

echo "✅ Backend deployment initiated!"
echo "🔗 Backend URL: https://clanplug-o7rp.onrender.com"
echo "⏳ Render will automatically deploy the changes..."
