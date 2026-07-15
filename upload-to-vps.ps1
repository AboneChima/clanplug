Write-Host "🚀 Uploading backend.tar.gz to VPS..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend.tar.gz")) {
    Write-Host "❌ backend.tar.gz not found!" -ForegroundColor Red
    Write-Host "Run: powershell -ExecutionPolicy Bypass -File rebuild.ps1" -ForegroundColor Yellow
    exit 1
}

$size = [math]::Round((Get-Item "backend.tar.gz").Length / 1MB, 2)
Write-Host "📦 File size: $size MB" -ForegroundColor White
Write-Host ""
Write-Host "📤 Uploading to 176.57.189.248:/var/www/clanplug/" -ForegroundColor Yellow
Write-Host "   This may take 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

# Use scp to upload
scp backend.tar.gz root@176.57.189.248:/var/www/clanplug/

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Upload complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. SSH into VPS: ssh root@176.57.189.248" -ForegroundColor White
    Write-Host "2. Run the commands in DEPLOY_COMMANDS.txt" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Upload failed!" -ForegroundColor Red
    Write-Host "Check password or network connection" -ForegroundColor Yellow
}
