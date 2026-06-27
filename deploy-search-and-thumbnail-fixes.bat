@echo off
echo Deploying Search Page and Video Thumbnail Fixes...
echo.

set VPS_IP=176.57.189.248
set VPS_USER=root
set VPS_FRONTEND=/var/www/clanplug/frontend

echo Uploading search page...
scp web\src\app\search\page.tsx %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/search/

echo Uploading profile page...
scp web\src\app\profile\page.tsx %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/profile/

echo Uploading user profile page...
scp "web\src\app\user\[id]\page.tsx" %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/user/[id]/

echo Building frontend...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_FRONTEND% && npm run build"

echo Restarting frontend...
ssh %VPS_USER%@%VPS_IP% "pm2 restart clanplug-frontend"

echo.
echo ✅ All fixes deployed!
echo.
echo Test search at: https://www.clanplug.site/search
echo Test video thumbnails at: https://www.clanplug.site/profile
pause
