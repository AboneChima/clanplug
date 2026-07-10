@echo off
echo.
echo ========================================
echo   PUSH NOTIFICATION SETUP ON VPS
echo ========================================
echo.

echo Step 1: Installing web-push package...
plink -batch -pw ClanPlugDB2024 root@176.57.189.248 "cd /root/clanplug && npm install web-push"

echo.
echo Step 2: Adding VAPID keys to .env...
plink -batch -pw ClanPlugDB2024 root@176.57.189.248 "cd /root/clanplug && grep -q 'VAPID_PUBLIC_KEY' .env || echo '' >> .env && echo '# Push Notifications - VAPID Keys' >> .env && echo 'VAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo' >> .env && echo 'VAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE' >> .env && echo 'VAPID_SUBJECT=mailto:support@clanplug.site' >> .env"

echo.
echo Step 3: Rebuilding backend...
plink -batch -pw ClanPlugDB2024 root@176.57.189.248 "cd /root/clanplug && npm run build"

echo.
echo Step 4: Restarting backend with PM2...
plink -batch -pw ClanPlugDB2024 root@176.57.189.248 "pm2 restart clanplug-backend"

echo.
echo Step 5: Checking status...
plink -batch -pw ClanPlugDB2024 root@176.57.189.248 "pm2 status"

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Test push notifications at:
echo https://www.clanplug.site/settings
echo.
pause
