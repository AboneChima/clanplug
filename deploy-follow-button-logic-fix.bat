@echo off
echo Deploying Follow Button Logic Fix...
echo.

set VPS_IP=176.57.189.248
set VPS_USER=root
set VPS_FRONTEND=/var/www/clanplug/frontend

echo Uploading user profile page...
scp "web\src\app\user\[id]\page.tsx" %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/user/[id]/

echo Building frontend...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_FRONTEND% && npm run build"

echo Restarting frontend...
ssh %VPS_USER%@%VPS_IP% "pm2 restart clanplug-frontend"

echo.
echo ✅ Follow button logic fixed!
echo.
echo 🔧 Button Logic (ALL SCENARIOS):
echo.
echo SCENARIO 1: Neither following each other
echo   → Shows: [Follow] + [Message]
echo.
echo SCENARIO 2: They follow you (you dont follow them)
echo   → Shows: [Follow Back] + [Message]
echo.
echo SCENARIO 3: You follow them (they dont follow you)
echo   → Shows: [Unfollow] + [Message]
echo.
echo SCENARIO 4: Both following each other (mutual friends)
echo   → Shows: [Unfollow] + [Message]
echo.
echo SCENARIO 5: After you unfollow (they still follow you)
echo   → Shows: [Follow Back] + [Message]
echo.
echo SCENARIO 6: After they unfollow you (you still follow them)
echo   → Shows: [Unfollow] + [Message]
echo.
echo Test at: https://www.clanplug.site/user/[userId]
pause
