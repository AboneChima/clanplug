# Railway Setup Script for Windows PowerShell
# Run this after installing Railway CLI and logging in

Write-Host "Railway Deployment Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Railway CLI not found. Installing..." -ForegroundColor Red
    iwr https://railway.app/install.ps1 | iex
    Write-Host "Railway CLI installed" -ForegroundColor Green
}

# Login check
Write-Host "Checking Railway authentication..." -ForegroundColor Yellow
railway whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Railway:" -ForegroundColor Yellow
    railway login
}

Write-Host ""
Write-Host "Initializing Railway project..." -ForegroundColor Cyan
railway init

Write-Host ""
Write-Host "Adding PostgreSQL database..." -ForegroundColor Cyan
railway add --database postgres

Write-Host ""
$addRedis = Read-Host "Do you want to add Redis? (y/n)"
if ($addRedis -eq "y") {
    Write-Host "Adding Redis..." -ForegroundColor Cyan
    railway add --database redis
}

Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Cyan

# Set production-specific variables
railway variables set NODE_ENV=production
railway variables set PORT=4000

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: railway up" -ForegroundColor White
Write-Host "2. Run: railway open" -ForegroundColor White
Write-Host "3. Get your URL and set FRONTEND_URL and APP_URL" -ForegroundColor White
Write-Host "4. Update your frontend .env.local with the Railway URL" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  railway logs" -ForegroundColor White
Write-Host "  railway variables" -ForegroundColor White
Write-Host "  railway status" -ForegroundColor White
Write-Host "  railway open" -ForegroundColor White
