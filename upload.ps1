Write-Host "Uploading to VPS..."

if (-not (Test-Path "backend.tar.gz")) {
    Write-Host "Error: backend.tar.gz not found"
    exit 1
}

scp backend.tar.gz root@176.57.189.248:/var/www/clanplug/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Upload complete!"
    Write-Host "Now SSH and run commands from DEPLOY_COMMANDS.txt"
} else {
    Write-Host "Upload failed"
}
