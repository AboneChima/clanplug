#!/bin/bash

##############################################
# Configure Nginx for ClanPlug
##############################################

set -e

# Configuration
DOMAIN="clanplug.site"
API_DOMAIN="api.clanplug.site"

echo "=================================="
echo "🌐 Configuring Nginx"
echo "=================================="
echo ""

# Create Nginx configuration for backend API
cat > /etc/nginx/sites-available/clanplug-api <<'EOF'
server {
    listen 80;
    server_name api.clanplug.site;

    # Upload size limit (100MB for videos)
    client_max_body_size 100M;

    # API requests
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Serve uploaded files directly from disk
    location /uploads/ {
        alias /var/www/clanplug/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF

# Create Nginx configuration for frontend
cat > /etc/nginx/sites-available/clanplug-frontend <<'EOF'
server {
    listen 80;
    server_name clanplug.site www.clanplug.site;

    # Next.js frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (Next.js)
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF

# Enable sites
ln -sf /etc/nginx/sites-available/clanplug-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/clanplug-frontend /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx

echo ""
echo "=================================="
echo "✅ Nginx Configured Successfully!"
echo "=================================="
echo ""
echo "Your sites:"
echo "  Frontend: http://clanplug.site"
echo "  Backend:  http://api.clanplug.site"
echo "  Uploads:  http://api.clanplug.site/uploads/"
echo ""
echo "Next step:"
echo "  Setup SSL: bash setup-ssl.sh"
echo ""
