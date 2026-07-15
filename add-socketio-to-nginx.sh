#!/bin/bash

# Add Socket.IO support to existing nginx config
echo "🔧 Adding Socket.IO WebSocket support to nginx..."

# Check if config exists
if [ ! -f /etc/nginx/sites-available/clanplug ]; then
    echo "❌ nginx config not found at /etc/nginx/sites-available/clanplug"
    exit 1
fi

# Backup
cp /etc/nginx/sites-available/clanplug /etc/nginx/sites-available/clanplug.backup.$(date +%Y%m%d_%H%M%S)

# Add Socket.IO location block before the main location block
# This uses sed to insert the Socket.IO config
sed -i '/location \/ {/i \    # Socket.IO WebSocket upgrade support\n    location /socket.io/ {\n        proxy_pass http://localhost:4000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_buffering off;\n        proxy_cache_bypass $http_upgrade;\n    }\n' /etc/nginx/sites-available/clanplug

# Test
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valid, reloading nginx..."
    systemctl reload nginx
    echo "✅ Socket.IO WebSocket support added!"
else
    echo "❌ Configuration error"
    echo "Restoring latest backup..."
    ls -t /etc/nginx/sites-available/clanplug.backup.* | head -1 | xargs -I {} cp {} /etc/nginx/sites-available/clanplug
fi
