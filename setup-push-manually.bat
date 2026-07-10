@echo off
echo ========================================
echo Setup Push Notifications on VPS
echo ========================================
echo.
echo This will guide you through setting up push notifications on your VPS
echo.
echo VPS IP: 176.57.189.248
echo Password: ClanPlugDB2024
echo.
pause

echo.
echo Step 1: Connecting to VPS...
echo Copy and run these commands one by one:
echo.
echo ----------------------------------------
echo ssh root@176.57.189.248
echo.
echo # Navigate to backend folder
echo cd /var/www/clanplug/backend
echo.
echo # Add VAPID keys to .env file
echo echo "" >> .env
echo echo "# Push Notifications - VAPID Keys" >> .env
echo echo "VAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo" >> .env
echo echo "VAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE" >> .env
echo echo "VAPID_SUBJECT=mailto:support@clanplug.site" >> .env
echo.
echo # Install web-push package
echo npm install web-push
echo.
echo # Run database migration
echo psql $DATABASE_URL -f /var/www/clanplug/backend/add-push-subscriptions.sql
echo.
echo # Restart backend
echo pm2 restart clanplug-backend
echo pm2 save
echo.
echo # Check if it's running
echo pm2 status
echo.
echo exit
echo ----------------------------------------
echo.
echo Copy all the commands above and paste them in the SSH terminal!
echo.
pause

echo.
echo ========================================
echo IMPORTANT: Upload Migration File
echo ========================================
echo.
echo You also need to upload the migration file to VPS.
echo Option 1: Use SCP command:
echo.
echo scp add-push-subscriptions.sql root@176.57.189.248:/var/www/clanplug/backend/
echo.
echo Or Option 2: Copy content manually:
echo 1. SSH into VPS
echo 2. Run: nano /var/www/clanplug/backend/add-push-subscriptions.sql
echo 3. Paste the content from add-push-subscriptions.sql file
echo 4. Save (Ctrl+X, Y, Enter)
echo.
pause
