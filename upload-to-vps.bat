@echo off
echo ========================================
echo   Uploading ClanPlug to VPS
echo ========================================
echo.

set VPS_IP=176.57.189.248

echo Step 1: Creating compressed archives...
echo.

REM Create backend archive
echo Compressing backend...
tar -czf backend.tar.gz src prisma package.json package-lock.json tsconfig.json

REM Create frontend archive
echo Compressing frontend...
cd web
tar -czf frontend.tar.gz src public package.json package-lock.json next.config.js tsconfig.json
cd ..

echo.
echo Step 2: Uploading to VPS...
echo.

REM Upload setup scripts
echo Uploading setup scripts...
scp contabo-setup.sh root@%VPS_IP%:/root/
scp deploy-to-contabo.sh root@%VPS_IP%:/root/
scp setup-nginx.sh root@%VPS_IP%:/root/

REM Upload backend
echo Uploading backend...
scp backend.tar.gz root@%VPS_IP%:/var/www/clanplug/

REM Upload frontend
echo Uploading frontend...
scp web\frontend.tar.gz root@%VPS_IP%:/var/www/clanplug/

REM Upload local storage service
echo Uploading storage service...
scp src\services\local-storage.service.ts root@%VPS_IP%:/var/www/clanplug/

echo.
echo ========================================
echo   Upload Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Connect to VPS: ssh root@%VPS_IP%
echo 2. Run: bash /root/deploy-to-contabo.sh
echo.

REM Clean up
del backend.tar.gz
del web\frontend.tar.gz

pause
