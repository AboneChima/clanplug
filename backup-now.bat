@echo off
echo.
echo ========================================
echo   ClanPlug Database Backup
echo ========================================
echo.
echo Backing up Render PostgreSQL database...
echo.

REM Run the Render backup script
node backup-render.js

echo.
echo ========================================
echo   Backup Complete!
echo ========================================
echo.
echo Your backup is saved in the backups\ folder
echo.
pause
