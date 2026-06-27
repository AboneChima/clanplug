#!/bin/bash

##############################################
# ClanPlug VPS Setup Script - Contabo
# Run this on your fresh Ubuntu 22.04 VPS
##############################################

set -e

echo "=================================="
echo "🚀 ClanPlug VPS Setup Starting..."
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install essential packages
echo -e "${BLUE}📦 Installing essential packages...${NC}"
apt install -y curl wget git ufw fail2ban htop nano

# Install Node.js 20.x
echo -e "${BLUE}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL 15
echo -e "${BLUE}🗄️ Installing PostgreSQL 15...${NC}"
apt install -y postgresql postgresql-contrib

# Install Redis
echo -e "${BLUE}🔴 Installing Redis...${NC}"
apt install -y redis-server

# Install Nginx
echo -e "${BLUE}🌐 Installing Nginx...${NC}"
apt install -y nginx

# Install PM2 (Process Manager)
echo -e "${BLUE}⚙️ Installing PM2...${NC}"
npm install -g pm2

# Install Certbot for SSL
echo -e "${BLUE}🔒 Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

# Configure UFW Firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create application directories
echo -e "${BLUE}📁 Creating application directories...${NC}"
mkdir -p /var/www/clanplug/backend
mkdir -p /var/www/clanplug/frontend
mkdir -p /var/www/clanplug/uploads/images
mkdir -p /var/www/clanplug/uploads/videos
mkdir -p /var/www/clanplug/uploads/avatars
mkdir -p /var/www/clanplug/uploads/marketplace
mkdir -p /var/www/clanplug/backups

# Set permissions for uploads folder
chmod -R 755 /var/www/clanplug/uploads
chown -R www-data:www-data /var/www/clanplug/uploads

echo ""
echo -e "${GREEN}✅ System packages installed successfully!${NC}"
echo ""

# Configure PostgreSQL
echo -e "${BLUE}🗄️ Configuring PostgreSQL...${NC}"
sudo -u postgres psql <<EOF
-- Create database
CREATE DATABASE clanplug;

-- Create user
CREATE USER clanplug_user WITH PASSWORD 'ClanPlug_DB_2024_Secure!@#';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE clanplug TO clanplug_user;

-- Exit
\q
EOF

echo -e "${GREEN}✅ PostgreSQL configured!${NC}"
echo ""

# Configure Redis
echo -e "${BLUE}🔴 Configuring Redis...${NC}"
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
systemctl restart redis
systemctl enable redis

echo -e "${GREEN}✅ Redis configured!${NC}"
echo ""

# Display installation summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ VPS Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Installed Services:"
echo "  ✅ Node.js $(node -v)"
echo "  ✅ PostgreSQL $(psql --version | head -n1)"
echo "  ✅ Redis $(redis-server --version)"
echo "  ✅ Nginx $(nginx -v 2>&1)"
echo "  ✅ PM2 $(pm2 -v)"
echo ""
echo "Next Steps:"
echo "  1. Update PostgreSQL password in the script"
echo "  2. Run: bash deploy-to-contabo.sh"
echo "  3. Configure SSL with: bash setup-ssl.sh"
echo ""
echo "Server Details:"
echo "  Backend: http://YOUR_IP:4000"
echo "  Frontend: http://YOUR_IP:3000"
echo "  Database: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "Security:"
echo "  ✅ Firewall enabled (SSH, HTTP, HTTPS only)"
echo "  ✅ PostgreSQL password protected"
echo "  ⚠️  Remember to change the default PostgreSQL password!"
echo ""
