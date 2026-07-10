#!/bin/bash

# Deploy Push Notifications to Contabo VPS
echo "🚀 Deploying push notification updates to Contabo VPS..."

# Add VAPID keys to .env
echo ""
echo "📝 Add these to your VPS .env file (/var/www/clanplug/backend/.env):"
echo ""
echo "VAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo"
echo "VAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE"
echo "VAPID_SUBJECT=mailto:support@clanplug.site"
echo ""

# SSH commands to run on VPS
echo "📡 Run these commands on your VPS:"
echo ""
echo "ssh root@176.57.189.248"
echo ""
echo "# Navigate to backend"
echo "cd /var/www/clanplug/backend"
echo ""
echo "# Run database migration"
echo "psql \$DATABASE_URL < add-push-subscriptions.sql"
echo ""
echo "# Install dependencies"
echo "npm install web-push"
echo ""
echo "# Restart backend"
echo "pm2 restart clanplug-backend"
echo "pm2 save"
echo ""
echo "✅ Done!"
