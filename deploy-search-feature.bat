@echo off
echo ========================================
echo Deploying Search Feature to Contabo VPS
echo ========================================
echo.

echo [1/5] Uploading backend files...
scp src/controllers/search.controller.ts root@176.57.189.248:/var/www/clanplug/backend/src/controllers/
scp src/services/search.service.ts root@176.57.189.248:/var/www/clanplug/backend/src/services/
scp src/routes/search.routes.ts root@176.57.189.248:/var/www/clanplug/backend/src/routes/
scp src/server.ts root@176.57.189.248:/var/www/clanplug/backend/src/

echo.
echo [2/5] Uploading frontend files...
scp web/src/components/SearchBar.tsx root@176.57.189.248:/var/www/clanplug/frontend/src/components/
scp web/src/app/posts/page.tsx root@176.57.189.248:/var/www/clanplug/frontend/src/app/posts/
scp web/src/app/feed/page.tsx root@176.57.189.248:/var/www/clanplug/frontend/src/app/feed/

echo.
echo [3/5] Building backend...
ssh root@176.57.189.248 "cd /var/www/clanplug/backend && npm run build"

echo.
echo [4/5] Building frontend...
ssh root@176.57.189.248 "cd /var/www/clanplug/frontend && npm run build"

echo.
echo [5/5] Restarting services...
ssh root@176.57.189.248 "pm2 restart clanplug-backend clanplug-frontend"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Check status: ssh root@176.57.189.248 "pm2 status"
echo Check logs: ssh root@176.57.189.248 "pm2 logs"
echo.
pause
