#!/bin/bash

echo "Updating Nginx configuration for larger file uploads..."

# Backup current config
cp /etc/nginx/sites-available/clanplug /etc/nginx/sites-available/clanplug.bak

# Remove old client_max_body_size if exists
sed -i '/client_max_body_size/d' /etc/nginx/sites-available/clanplug

# Add client_max_body_size to server blocks
sed -i '/server {/a \    client_max_body_size 50M;' /etc/nginx/sites-available/clanplug

# Test configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration error, restoring backup"
    cp /etc/nginx/sites-available/clanplug.bak /etc/nginx/sites-available/clanplug
fi

echo "Done!"
