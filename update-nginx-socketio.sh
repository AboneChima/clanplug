#!/bin/bash

# Update nginx configuration to support Socket.IO WebSocket connections

echo "🔧 Updating nginx configuration for Socket.IO..."

# Backup existing config
cp /etc/nginx/sites-available/clanplug /etc/nginx/sites-available/clanplug.backup

# Create updated config with Socket.IO support
cat > /etc/nginx/sites-available/clanplug << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.clanplug.site;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.clanplug.site;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.clanplug.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.clanplug.site/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;

    # Increase timeouts for Socket.IO
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # Socket.IO WebSocket upgrade support
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # Regular API endpoints
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valid, reloading nginx..."
    systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
    echo ""
    echo "Socket.IO should now be accessible at:"
    echo "wss://api.clanplug.site/socket.io/"
else
    echo "❌ Configuration error, restoring backup..."
    cp /etc/nginx/sites-available/clanplug.backup /etc/nginx/sites-available/clanplug
    echo "Original configuration restored"
fi
