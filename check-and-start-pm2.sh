#!/bin/bash

echo "Checking PM2 processes..."
pm2 list

echo ""
echo "Looking for backend process..."
pm2 list | grep -i backend || pm2 list | grep -i clan || pm2 list | grep -i api

echo ""
echo "Starting backend service..."
cd /var/www/clanplug/backend

# Try to find existing process name
EXISTING_PROCESS=$(pm2 list | grep -o 'clanplug-[a-z]*' | head -n 1)

if [ -n "$EXISTING_PROCESS" ]; then
    echo "Found existing process: $EXISTING_PROCESS"
    echo "Restarting $EXISTING_PROCESS..."
    pm2 restart $EXISTING_PROCESS
else
    echo "No existing process found, starting new one..."
    pm2 start dist/server.js --name clanplug-backend
fi

echo ""
echo "Waiting for startup..."
sleep 5

echo ""
echo "PM2 Status:"
pm2 list

echo ""
echo "Recent logs:"
pm2 logs --lines 30 --nostream

echo ""
echo "Testing Socket.IO:"
curl -s http://localhost:4000/socket.io/ | head -n 5

echo ""
echo "Testing health:"
curl -s http://localhost:4000/health

echo ""
echo "Testing groups API:"
curl -s -o /dev/null -w "Groups API Status: %{http_code}\n" http://localhost:4000/api/groups
