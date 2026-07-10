Write-Host "🔔 Setting up Push Notifications on VPS..." -ForegroundColor Cyan
Write-Host ""

$command = @"
cd /var/www/clanplug/backend && npm install web-push && grep -q 'VAPID_PUBLIC_KEY' .env || echo -e '\n# Push Notifications - VAPID Keys\nVAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo\nVAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE\nVAPID_SUBJECT=mailto:support@clanplug.site' >> .env && npm run build && pm2 restart clanplug-backend && pm2 status
"@

Write-Host "Connecting to VPS..." -ForegroundColor Yellow
Write-Host "When prompted, enter password: ClanPlugDB2024" -ForegroundColor Yellow
Write-Host ""

ssh root@176.57.189.248 $command

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Test push notifications at: https://www.clanplug.site/settings" -ForegroundColor Cyan
Write-Host ""
