# ClanPlug Auto-Deploy Script
# This script will deploy everything to your Contabo VPS automatically

$VPS_IP = "176.57.189.248"
$VPS_USER = "root"
$VPS_PASS = "wK6Pf7D2i5pH"

Write-Host "=================================="
Write-Host "  ClanPlug Auto-Deploy to VPS"
Write-Host "=================================="
Write-Host ""

# Step 1: Create archives locally
Write-Host "Step 1: Creating deployment packages..." -ForegroundColor Cyan

# Backend
Write-Host "  Packaging backend..."
tar -czf backend.tar.gz src prisma package.json package-lock.json tsconfig.json

# Frontend
Write-Host "  Packaging frontend..."
Set-Location web
tar -czf frontend.tar.gz src public package.json package-lock.json next.config.js
Set-Location ..

Write-Host "  Packages created!" -ForegroundColor Green
Write-Host ""

# Step 2: Upload using SCP
Write-Host "Step 2: Uploading to VPS..." -ForegroundColor Cyan
Write-Host "  IP: $VPS_IP" -ForegroundColor Yellow
Write-Host ""

# Upload setup scripts
Write-Host "  Uploading setup scripts..."
scp contabo-setup.sh "${VPS_USER}@${VPS_IP}:/root/"
scp deploy-to-contabo.sh "${VPS_USER}@${VPS_IP}:/root/"
scp setup-nginx.sh "${VPS_USER}@${VPS_IP}:/root/"

# Upload archives
Write-Host "  Uploading backend..."
scp backend.tar.gz "${VPS_USER}@${VPS_IP}:/root/"

Write-Host "  Uploading frontend..."
scp web\frontend.tar.gz "${VPS_USER}@${VPS_IP}:/root/"

Write-Host "  Upload complete!" -ForegroundColor Green
Write-Host ""

# Step 3: Execute setup on VPS
Write-Host "Step 3: Running setup on VPS..." -ForegroundColor Cyan
Write-Host "  This will take 15-20 minutes..." -ForegroundColor Yellow
Write-Host ""

# Create a script to run on the VPS
$remoteScript = @"
#!/bin/bash
set -e

echo "Starting VPS setup..."

# Make scripts executable
chmod +x /root/contabo-setup.sh
chmod +x /root/deploy-to-contabo.sh
chmod +x /root/setup-nginx.sh

# Run setup
echo "Installing system packages..."
bash /root/contabo-setup.sh

# Create directories
echo "Creating application directories..."
mkdir -p /var/www/clanplug/backend
mkdir -p /var/www/clanplug/frontend

# Extract archives
echo "Extracting backend..."
cd /var/www/clanplug/backend
tar -xzf /root/backend.tar.gz

echo "Extracting frontend..."
cd /var/www/clanplug/frontend
tar -xzf /root/frontend.tar.gz

echo "Setup complete!"
echo "Next: Configure environment and deploy"
"@

# Save script locally
$remoteScript | Out-File -FilePath "remote-setup.sh" -Encoding ASCII

# Upload and execute
Write-Host "  Uploading and executing setup script..."
scp remote-setup.sh "${VPS_USER}@${VPS_IP}:/root/"
ssh "${VPS_USER}@${VPS_IP}" "bash /root/remote-setup.sh"

Write-Host ""
Write-Host "=================================="
Write-Host "  Setup Complete!"
Write-Host "=================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Configure environment variables"
Write-Host "  2. Run deployment script"
Write-Host "  3. Setup SSL certificates"
Write-Host ""
Write-Host "Connect to VPS: ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor Yellow

# Cleanup
Remove-Item backend.tar.gz
Remove-Item web\frontend.tar.gz
Remove-Item remote-setup.sh

pause
