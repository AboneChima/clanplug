#!/bin/bash

##############################################
# Deploy ClanPlug to Contabo VPS
# Run this script to deploy your application
##############################################

set -e

# Configuration
VPS_IP="176.57.189.248"
DB_PASSWORD="ClanPlug_DB_2024_Secure!@#"  # Strong database password

echo "=================================="
echo "🚀 Deploying ClanPlug to Contabo"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root (use sudo)"
   exit 1
fi

# Navigate to backend directory
echo -e "${BLUE}📦 Deploying Backend...${NC}"
cd /var/www/clanplug/backend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy
npx prisma generate

# Build TypeScript
echo "Building backend..."
npm run build

echo -e "${GREEN}✅ Backend deployed!${NC}"
echo ""

# Navigate to frontend directory
echo -e "${BLUE}🎨 Deploying Frontend...${NC}"
cd /var/www/clanplug/frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Build Next.js app
echo "Building frontend..."
npm run build

echo -e "${GREEN}✅ Frontend deployed!${NC}"
echo ""

# Configure PM2
echo -e "${BLUE}⚙️ Configuring PM2...${NC}"

# Backend PM2 configuration
cat > /var/www/clanplug/backend/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'clanplug-backend',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      DATABASE_URL: 'postgresql://clanplug_user:${DB_PASSWORD}@localhost:5432/clanplug',
      REDIS_URL: 'redis://localhost:6379'
    },
    error_file: '/var/www/clanplug/logs/backend-error.log',
    out_file: '/var/www/clanplug/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF

# Frontend PM2 configuration
cat > /var/www/clanplug/frontend/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'clanplug-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/clanplug/frontend',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://api.clanplug.site'
    },
    error_file: '/var/www/clanplug/logs/frontend-error.log',
    out_file: '/var/www/clanplug/logs/frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Create logs directory
mkdir -p /var/www/clanplug/logs

# Stop existing PM2 processes if any
pm2 delete all || true

# Start applications with PM2
echo "Starting backend..."
cd /var/www/clanplug/backend
pm2 start ecosystem.config.js

echo "Starting frontend..."
cd /var/www/clanplug/frontend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

echo -e "${GREEN}✅ Applications started with PM2!${NC}"
echo ""

# Display status
echo "=================================="
echo "📊 Deployment Status"
echo "=================================="
pm2 status
echo ""
echo "🌐 Your application is running on:"
echo "   Frontend: http://${VPS_IP}:3000"
echo "   Backend:  http://${VPS_IP}:4000"
echo ""
echo "Next steps:"
echo "  1. Configure Nginx: bash setup-nginx.sh"
echo "  2. Setup SSL: bash setup-ssl.sh"
echo ""
