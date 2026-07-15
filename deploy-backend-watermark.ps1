# Deploy backend with watermark feature to VPS
Write-Host "🚀 Deploying backend with video watermark feature..." -ForegroundColor Cyan

# SSH into VPS and pull latest changes
ssh root@176.57.189.248 @"
cd /var/www/clanplug/backend
echo '📥 Pulling latest changes...'
git pull origin main

echo '📦 Installing dependencies...'
npm install

echo '🔨 Building TypeScript...'
npm run build

echo '🔄 Restarting backend service...'
pm2 restart clanplug-backend

echo '✅ Backend deployment complete!'
pm2 logs clanplug-backend --lines 20
"@

Write-Host "✅ Deployment complete! Video watermarks will now be embedded in all uploaded videos." -ForegroundColor Green
