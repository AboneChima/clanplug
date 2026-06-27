@echo off
echo Deploying Upload Fixes to Contabo VPS...
echo.

set VPS_IP=176.57.189.248
set VPS_USER=root
set VPS_BACKEND=/var/www/clanplug/backend
set VPS_FRONTEND=/var/www/clanplug/frontend

echo Uploading backend controller...
scp src\controllers\post.controller.ts %VPS_USER%@%VPS_IP%:%VPS_BACKEND%/src/controllers/

echo Uploading backend routes...
scp src\routes\post.routes.ts %VPS_USER%@%VPS_IP%:%VPS_BACKEND%/src/routes/

echo Uploading local storage service...
scp src\services\local-storage.service.ts %VPS_USER%@%VPS_IP%:%VPS_BACKEND%/src/services/

echo Uploading marketplace create page...
scp web\src\app\marketplace\create\page.tsx %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/app/marketplace/create/

echo Uploading upload progress component...
scp web\src\components\UploadProgress.tsx %VPS_USER%@%VPS_IP%:%VPS_FRONTEND%/src/components/

echo Building backend...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_BACKEND% && npm run build"

echo Building frontend...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_FRONTEND% && npm run build"

echo Restarting services...
ssh %VPS_USER%@%VPS_IP% "pm2 restart clanplug-backend clanplug-frontend"

echo.
echo ✅ Upload fixes deployed successfully!
echo 🧪 Test at: https://www.clanplug.site/marketplace/create
pause
