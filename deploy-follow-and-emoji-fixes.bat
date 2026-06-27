@echo off
echo Deploying Follow Button and Emoji Fixes...
echo.

set VPS_IP=176.57.189.248
set VPS_USER=root
set VPS_FRONTEND=/var/www/clanplug/frontend

echo Uploading user profile page (follow fixes)...
scp "web\src\app\user\[id]\page.tsx" %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/user/[id]/

echo Uploading feed page (emoji fixes)...
scp web\src\app\feed\page.tsx %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/feed/

echo Building frontend...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_FRONTEND% && npm run build"

echo Restarting frontend...
ssh %VPS_USER%@%VPS_IP% "pm2 restart clanplug-frontend"

echo.
echo ✅ All fixes deployed!
echo.
echo 🔧 What changed:
echo.
echo FOLLOW BUTTON FIXES:
echo - Added detailed console logging for debugging
echo - Fixed follow/unfollow API calls
echo - Smart follow buttons:
echo   * "Follow Back" if they follow you
echo   * "Follow" if they dont follow you
echo   * "Unfollow" button when you follow them
echo   * "Message" button always visible
echo   * If mutual friends: only Message and Unfollow buttons
echo.
echo EMOJI POST FIXES:
echo - Feed now shows emoji-only posts in large 5xl size
echo - Applies to posts with only emojis (max 20 chars)
echo - Regular text posts show normally
echo - Works for existing and new posts
echo.
echo Test at: https://www.clanplug.site
pause
