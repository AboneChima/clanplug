@echo off
echo ========================================
echo Deploying All Fixes to Contabo VPS
echo ========================================
echo.

echo [1/7] Uploading backend files...
scp src/controllers/upload.controller.ts root@176.57.189.248:/var/www/clanplug/backend/src/controllers/
scp src/controllers/search.controller.ts root@176.57.189.248:/var/www/clanplug/backend/src/controllers/
scp src/routes/upload.routes.ts root@176.57.189.248:/var/www/clanplug/backend/src/routes/
scp src/routes/search.routes.ts root@176.57.189.248:/var/www/clanplug/backend/src/routes/
scp src/services/search.service.ts root@176.57.189.248:/var/www/clanplug/backend/src/services/
scp src/server.ts root@176.57.189.248:/var/www/clanplug/backend/src/

echo.
echo [2/7] Uploading frontend files...
scp web/src/components/SearchBar.tsx root@176.57.189.248:/var/www/clanplug/frontend/src/components/
scp web/src/app/posts/page.tsx root@176.57.189.248:/var/www/clanplug/frontend/src/app/posts/
scp web/src/app/feed/page.tsx root@176.57.189.248:/var/www/clanplug/frontend/src/app/feed/

echo.
echo [3/7] Creating upload directories...
ssh root@176.57.189.248 "mkdir -p /var/www/clanplug/uploads/{images,videos,avatars,marketplace,temp} && chmod 755 /var/www/clanplug/uploads -R"

echo.
echo [4/7] Adding environment variables...
ssh root@176.57.189.248 "grep -q 'UPLOAD_DIR' /var/www/clanplug/backend/.env || echo 'UPLOAD_DIR=/var/www/clanplug/uploads' >> /var/www/clanplug/backend/.env"
ssh root@176.57.189.248 "grep -q 'UPLOAD_URL_BASE' /var/www/clanplug/backend/.env || echo 'UPLOAD_URL_BASE=https://api.clanplug.site/uploads' >> /var/www/clanplug/backend/.env"

echo.
echo [5/7] Building backend...
ssh root@176.57.189.248 "cd /var/www/clanplug/backend && npm run build"

echo.
echo [6/7] Building frontend...
ssh root@176.57.189.248 "cd /var/www/clanplug/frontend && npm run build"

echo.
echo [7/7] Restarting services...
ssh root@176.57.189.248 "pm2 restart all"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Test the following:
echo 1. Search: https://clanplug.site/feed (use search bar)
echo 2. Upload: https://clanplug.site/marketplace/create (upload images)
echo 3. Chats: https://clanplug.site/chat
echo 4. Followers: Go to any profile and click followers/following
echo.
echo Check status: ssh root@176.57.189.248 "pm2 status"
echo Check logs: ssh root@176.57.189.248 "pm2 logs --lines 50"
echo.
pause
