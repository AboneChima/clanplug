Write-Host "🔧 Fixing Push Notifications on VPS..." -ForegroundColor Cyan

$commands = "cd /root/clanplug; echo '📦 Installing web-push...'; npm install web-push; echo '🔑 Checking VAPID keys...'; grep -q 'VAPID_PUBLIC_KEY' .env || echo '`n# Push Notifications - VAPID Keys`nVAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo`nVAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE`nVAPID_SUBJECT=mailto:support@clanplug.site' >> .env; echo '🔄 Rebuilding backend...'; npm run build; echo '♻️ Restarting backend with PM2...'; pm2 restart clanplug-backend; echo '📊 Checking backend status...'; pm2 status; echo '✅ Push notifications fixed!'"

ssh root@176.57.189.248 $commands

Write-Host "✅ Done! Push notifications should now work." -ForegroundColor Green
