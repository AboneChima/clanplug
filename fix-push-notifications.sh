#!/bin/bash

echo "🔧 Fixing Push Notifications on VPS..."

# Connect to VPS and fix push notifications
ssh root@176.57.189.248 << 'ENDSSH'

cd /root/clanplug

echo "📦 Installing web-push..."
npm install web-push

echo "🔑 Checking VAPID keys in .env..."
if grep -q "VAPID_PUBLIC_KEY" .env; then
  echo "✅ VAPID keys found in .env"
else
  echo "❌ VAPID keys missing! Adding them..."
  echo "" >> .env
  echo "# Push Notifications - VAPID Keys" >> .env
  echo "VAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo" >> .env
  echo "VAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE" >> .env
  echo "VAPID_SUBJECT=mailto:support@clanplug.site" >> .env
fi

echo "🔄 Rebuilding backend..."
npm run build

echo "♻️ Restarting backend with PM2..."
pm2 restart clanplug-backend

echo "📊 Checking backend status..."
pm2 status

echo "✅ Push notifications fixed!"

ENDSSH

echo "✅ Done! Push notifications should now work."
