@echo off
echo Deploying Video Thumbnail Fix...
echo.

set VPS_IP=176.57.189.248
set VPS_USER=root
set VPS_FRONTEND=/var/www/clanplug/frontend

echo Uploading profile page...
scp web\src\app\profile\page.tsx %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/profile/

echo Uploading user profile page...
scp "web\src\app\user\[id]\page.tsx" %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/user/[id]/

echo Building frontend...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_FRONTEND% && npm run build"

echo Restarting frontend...
ssh %VPS_USER%@%VPS_IP% "pm2 restart clanplug-frontend"

echo.
echo ✅ Video thumbnail fix deployed!
echo 🧪 Test at: https://www.clanplug.site/profile
pause
