# Deploy Follow Button Fix to Contabo VPS
Write-Host "🚀 Deploying follow button fix to Contabo VPS..." -ForegroundColor Green

$vpsIp = "176.57.189.248"
$vpsUser = "root"
$vpsPassword = "ClanPlugDB2024"

# Install plink if not available (for automated SSH)
Write-Host "📦 Uploading frontend build..." -ForegroundColor Yellow

# Use WinSCP or pscp for automated file transfer
# For now, let's use SSH with expect-like behavior via plink

# Create temp script for remote commands
$remoteCommands = @"
cd /var/www/clanplug/frontend
pm2 stop clanplug-frontend
pm2 delete clanplug-frontend
npm run build
pm2 start npm --name clanplug-frontend -- start
pm2 save
"@

Write-Host "📝 Remote commands prepared" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Please run these commands manually on VPS:" -ForegroundColor Cyan
Write-Host "ssh root@$vpsIp" -ForegroundColor White
Write-Host "Password: ClanPlugDB2024" -ForegroundColor White
Write-Host ""
Write-Host "Then run:" -ForegroundColor Cyan
Write-Host $remoteCommands -ForegroundColor White
Write-Host ""
Write-Host "✅ Or use this one-liner after SSH:" -ForegroundColor Green
Write-Host "cd /var/www/clanplug/frontend && git pull && npm run build && pm2 restart clanplug-frontend" -ForegroundColor Yellow
