#!/bin/bash
# Upload and rebuild push notifications on VPS

echo "🔨 Rebuilding backend on VPS..."
cd /var/www/clanplug/backend
npm run build
pm2 restart clanplug-backend
echo "✅ Backend rebuilt and restarted"
