#!/bin/bash
set -e

echo "Copying .env from backup..."
cp /var/www/clanplug/backend_backup_20260713_155538/.env /var/www/clanplug/backend/.env

echo "Restarting backend..."
pm2 restart clanplug-backend

echo "Waiting 5 seconds..."
sleep 5

echo "Checking logs..."
pm2 logs clanplug-backend --lines 30 --nostream

echo ""
echo "Testing groups API..."
curl -i http://localhost:4000/api/groups | head -n 15
