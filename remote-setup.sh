#!/bin/bash
set -e

echo "Starting VPS setup..."

# Make scripts executable
chmod +x /root/contabo-setup.sh
chmod +x /root/deploy-to-contabo.sh
chmod +x /root/setup-nginx.sh

# Run setup
echo "Installing system packages..."
bash /root/contabo-setup.sh

# Create directories
echo "Creating application directories..."
mkdir -p /var/www/clanplug/backend
mkdir -p /var/www/clanplug/frontend

# Extract archives
echo "Extracting backend..."
cd /var/www/clanplug/backend
tar -xzf /root/backend.tar.gz

echo "Extracting frontend..."
cd /var/www/clanplug/frontend
tar -xzf /root/frontend.tar.gz

echo "Setup complete!"
echo "Next: Configure environment and deploy"
