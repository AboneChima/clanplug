@echo off
echo ================================
echo Deploy Follow Button Fix to VPS
echo ================================
echo.
echo This will SSH into your VPS and deploy the fix
echo.
echo VPS IP: 176.57.189.248
echo Password: ClanPlugDB2024
echo.
pause

ssh root@176.57.189.248 "cd /var/www/clanplug/frontend && git pull && npm run build && pm2 restart clanplug-frontend && echo '✅ Frontend deployed successfully!' && cd ../backend && git pull && pm2 restart clanplug-backend && echo '✅ Backend deployed successfully!'"

echo.
echo ================================
echo Deployment Complete!
echo ================================
pause
