@echo off
REM Script to boost engagement for abonejoseph@gmail.com on Windows
REM This will add 5000 followers, 300 likes, and 30 comments

echo.
echo 🚀 Boosting engagement for abonejoseph@gmail.com...
echo.
echo This will:
echo   - Add 5,000 bot followers
echo   - Add 300 likes to their post
echo   - Add 30 comments to their post
echo.
echo Press Ctrl+C to cancel, or wait 5 seconds to continue...
timeout /t 5 /nobreak >nul

REM Database connection string
set DATABASE_URL=postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon

echo.
echo 📊 Executing SQL script...
echo.

REM Execute the SQL script
psql "%DATABASE_URL%" -f boost-abonejoseph-engagement.sql

echo.
echo ✅ Done! Check the output above for results.
echo.
pause
