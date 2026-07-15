# Deploy Video Thumbnails to VPS
# Run this script and enter your VPS password when prompted

Write-Host "🚀 Deploying Video Thumbnail Feature to VPS..." -ForegroundColor Green
Write-Host ""

$commands = @"
cd /var/www/clanplug && \
echo '📥 Pulling latest code...' && \
git pull origin main && \
echo '📦 Installing ffmpeg...' && \
apt-get update && apt-get install -y ffmpeg && \
echo '✅ ffmpeg installed' && \
echo '🗄️  Running database migration...' && \
npx prisma migrate deploy && \
echo '🔄 Generating Prisma client...' && \
npx prisma generate && \
echo '🔄 Restarting backend...' && \
pm2 restart all && \
echo '✅ Deployment complete!' && \
pm2 logs --lines 20
"@

Write-Host "📡 Connecting to VPS 176.57.189.248..." -ForegroundColor Cyan
Write-Host "⚠️  You will be prompted for the VPS password" -ForegroundColor Yellow
Write-Host ""

ssh root@176.57.189.248 $commands

Write-Host ""
Write-Host "✅ Done! Check the logs above for any errors." -ForegroundColor Green
Write-Host "📹 New video posts will now automatically generate thumbnails!" -ForegroundColor Green
