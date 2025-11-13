# Railway Setup Script for Windows PowerShell
# Run this after installing Railway CLI and logging in

Write-Host "🚂 Railway Deployment Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    iwr https://railway.app/install.ps1 | iex
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
}

# Login check
Write-Host "Checking Railway authentication..." -ForegroundColor Yellow
railway whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Railway:" -ForegroundColor Yellow
    railway login
}

Write-Host ""
Write-Host "📦 Initializing Railway project..." -ForegroundColor Cyan
railway init

Write-Host ""
Write-Host "🗄️  Adding PostgreSQL database..." -ForegroundColor Cyan
railway add --database postgres

Write-Host ""
$addRedis = Read-Host "Do you want to add Redis? (y/n)"
if ($addRedis -eq "y") {
    Write-Host "Adding Redis..." -ForegroundColor Cyan
    railway add --database redis
}

Write-Host ""
Write-Host "🔐 Setting environment variables..." -ForegroundColor Cyan

# Read from .env file
if (Test-Path .env) {
    Write-Host "Found .env file. Setting variables..." -ForegroundColor Yellow
    
    $envVars = @(
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "JWT_EXPIRES_IN",
        "JWT_REFRESH_EXPIRES_IN",
        "BCRYPT_ROUNDS",
        "FLUTTERWAVE_SECRET_KEY",
        "FLUTTERWAVE_PUBLIC_KEY",
        "FLUTTERWAVE_WEBHOOK_SECRET",
        "CLUBKONNECT_USERID",
        "CLUBKONNECT_APIKEY",
        "CLUBKONNECT_BASE_URL",
        "NOWPAYMENTS_API_KEY",
        "NOWPAYMENTS_IPN_SECRET",
        "NOWPAYMENTS_BASE_URL",
        "NOWPAYMENTS_SANDBOX",
        "APP_NAME",
        "ADMIN_EMAIL",
        "ADMIN_ACCESS_KEY",
        "DEFAULT_CURRENCY",
        "SUPPORTED_CURRENCIES",
        "DEPOSIT_FEE",
        "WITHDRAWAL_FEE",
        "TRANSACTION_FEE",
        "EMAIL_HOST",
        "EMAIL_PORT",
        "EMAIL_USER",
        "EMAIL_PASS",
        "EMAIL_FROM",
        "RATE_LIMIT_WINDOW_MS",
        "RATE_LIMIT_MAX_REQUESTS"
    )
    
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2].Trim('"')
            
            if ($envVars -contains $key -and $value -ne "" -and $value -notlike "*localhost*") {
                Write-Host "Setting $key..." -ForegroundColor Gray
                railway variables set "$key=$value"
            }
        }
    }
}

# Set production-specific variables
Write-Host ""
Write-Host "Setting production variables..." -ForegroundColor Yellow
railway variables set NODE_ENV="production"
railway variables set PORT="4000"

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run 'railway up' to deploy" -ForegroundColor White
Write-Host "2. Run 'railway open' to view your deployment" -ForegroundColor White
Write-Host "3. Get your URL and update FRONTEND_URL and APP_URL" -ForegroundColor White
Write-Host "4. Update your frontend .env.local with the Railway URL" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  railway logs          - View logs" -ForegroundColor White
Write-Host "  railway variables     - View all variables" -ForegroundColor White
Write-Host "  railway status        - Check deployment status" -ForegroundColor White
Write-Host "  railway open          - Open dashboard" -ForegroundColor White
