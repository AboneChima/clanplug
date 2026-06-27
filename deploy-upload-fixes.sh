#!/bin/bash

# Deploy Upload Fixes to Contabo VPS
# Fixes: Upload progress, field name mismatch, error handling

VPS_IP="176.57.189.248"
VPS_USER="root"
VPS_BACKEND="/var/www/clanplug/backend"
VPS_FRONTEND="/var/www/clanplug/frontend"

echo "🚀 Deploying Upload Fixes to Contabo VPS..."

# Upload backend files
echo "📤 Uploading backend controller..."
scp src/controllers/post.controller.ts $VPS_USER@$VPS_IP:$VPS_BACKEND/src/controllers/

echo "📤 Uploading backend routes..."
scp src/routes/post.routes.ts $VPS_USER@$VPS_IP:$VPS_BACKEND/src/routes/

echo "📤 Uploading local storage service..."
scp src/services/local-storage.service.ts $VPS_USER@$VPS_IP:$VPS_BACKEND/src/services/

# Upload frontend files
echo "📤 Uploading marketplace create page..."
scp web/src/app/marketplace/create/page.tsx $VPS_USER@$VPS_IP:$VPS_FRONTEND/src/app/marketplace/create/

echo "📤 Uploading upload progress component..."
scp web/src/components/UploadProgress.tsx $VPS_USER@$VPS_IP:$VPS_FRONTEND/src/components/

# Rebuild backend
echo "🔨 Building backend..."
ssh $VPS_USER@$VPS_IP "cd $VPS_BACKEND && npm run build"

# Rebuild frontend
echo "🔨 Building frontend..."
ssh $VPS_USER@$VPS_IP "cd $VPS_FRONTEND && npm run build"

# Restart services
echo "🔄 Restarting services..."
ssh $VPS_USER@$VPS_IP "pm2 restart clanplug-backend clanplug-frontend"

echo "✅ Upload fixes deployed successfully!"
echo ""
echo "🧪 Test uploads at: https://www.clanplug.site/marketplace/create"
