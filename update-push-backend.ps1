# Upload updated push service to VPS and rebuild backend

Write-Host "🚀 Uploading push service to VPS..." -ForegroundColor Cyan

# Upload the push service file
scp "src/services/push.service.ts" root@176.57.189.248:/var/www/clanplug/backend/src/services/

Write-Host "✅ File uploaded successfully" -ForegroundColor Green

Write-Host "🔨 Rebuilding and restarting backend..." -ForegroundColor Cyan

# Rebuild and restart backend (using semicolon for multiple commands in SSH)
ssh root@176.57.189.248 "cd /var/www/clanplug/backend ; npm run build ; pm2 restart clanplug-backend"

Write-Host "✅ Backend rebuilt and restarted" -ForegroundColor Green
Write-Host "🎉 Push notifications should now work!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://www.clanplug.site/settings" -ForegroundColor White
Write-Host "2. Toggle ON 'Push Notifications'" -ForegroundColor White
Write-Host "3. Allow notifications when browser asks" -ForegroundColor White
Write-Host "4. Click 'Test Notification' button" -ForegroundColor White
Write-Host "5. You should see a popup notification!" -ForegroundColor White
