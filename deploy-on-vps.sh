#!/bin/bash
set -e

echo "🚀 Deploying Socket.IO backend..."
echo ""

# Backup existing backend
cd /var/www/clanplug
if [ -d backend ]; then
    echo "📦 Backing up existing backend..."
    mv backend backend_backup_$(date +%Y%m%d_%H%M%S)
fi

# Create new backend directory
echo "📁 Creating backend directory..."
mkdir -p backend && cd backend

# Extract uploaded files
echo "📂 Extracting files..."
tar -xzf ../backend.tar.gz

# Remove tarball
rm ../backend.tar.gz

# Check .env
if [ ! -f .env ]; then
    echo "⚠️  No .env file found, copying from backup..."
    cp ../backend_backup*/.env . 2>/dev/null || echo "❌ No backup .env found - need to create one!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Verify socket.io is installed
echo "🔍 Verifying socket.io..."
if ls node_modules/ | grep -q socket.io; then
    echo "✅ socket.io is installed"
else
    echo "❌ socket.io NOT found, installing..."
    npm install socket.io@^4.7.4
fi

# Restart PM2
echo "🔄 Restarting service..."
pm2 restart clanplug-api || pm2 start dist/server.js --name clanplug-api

# Wait for startup
echo "⏳ Waiting for service to start..."
sleep 5

# Show logs
echo ""
echo "📋 Recent logs:"
pm2 logs clanplug-api --lines 30 --nostream

echo ""
echo "🧪 Testing Socket.IO endpoint..."
curl -s http://localhost:4000/socket.io/ | head -n 5

echo ""
echo "🧪 Testing groups API..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:4000/api/groups

echo ""
echo "✅ Deployment complete!"
echo "Check logs with: pm2 logs clanplug-api"
