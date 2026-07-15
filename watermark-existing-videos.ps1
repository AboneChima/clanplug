# Add watermark to all existing videos on VPS
Write-Host "Adding watermark to existing videos..." -ForegroundColor Cyan

# Copy script to VPS
Write-Host "Uploading script to VPS..." -ForegroundColor Yellow
scp add-watermark-to-existing-videos.js root@176.57.189.248:/var/www/clanplug/backend/

# SSH into VPS and run the script
ssh root@176.57.189.248 "cd /var/www/clanplug/backend && node add-watermark-to-existing-videos.js"

Write-Host "Done! All videos now have watermarks embedded." -ForegroundColor Green
