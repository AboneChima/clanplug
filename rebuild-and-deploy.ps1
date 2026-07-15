# Rebuild and Deploy Backend with Socket.IO
Write-Host "🔨 Starting rebuild process..." -ForegroundColor Cyan

# Step 1: Clean old build
Write-Host "`n📦 Cleaning old dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "✅ Old build cleaned" -ForegroundColor Green
}

# Step 2: Rebuild with increased memory
Write-Host "`n🔨 Building TypeScript..." -ForegroundColor Yellow
$env:NODE_OPTIONS="--max-old-space-size=460"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Step 3: Verify Socket.IO files
Write-Host "`n🔍 Verifying Socket.IO files..." -ForegroundColor Yellow
if (Test-Path "dist/socket/socket.js") {
    Write-Host "✅ Socket.IO file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Socket.IO file missing!" -ForegroundColor Red
    exit 1
}

if (Test-Path "dist/routes/group.routes.js") {
    Write-Host "✅ Group routes exist" -ForegroundColor Green
} else {
    Write-Host "❌ Group routes missing!" -ForegroundColor Red
    exit 1
}

# Step 4: Check if socket.io is in node_modules
Write-Host "`n🔍 Checking socket.io installation..." -ForegroundColor Yellow
if (Test-Path "node_modules/socket.io") {
    Write-Host "✅ socket.io is installed" -ForegroundColor Green
} else {
    Write-Host "❌ socket.io not installed! Installing..." -ForegroundColor Red
    npm install socket.io@^4.7.4
}

# Step 5: Create deployment tarball
Write-Host "`n📦 Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "backend.tar.gz") {
    Remove-Item "backend.tar.gz"
}

# Include all necessary files
tar -czf backend.tar.gz `
    dist/ `
    node_modules/ `
    prisma/ `
    package.json `
    package-lock.json `
    .env.production `
    tsconfig.json

Write-Host "✅ Deployment package created" -ForegroundColor Green

# Step 6: Display next steps
Write-Host "`n✅ BUILD COMPLETE!" -ForegroundColor Green
Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Upload backend.tar.gz to VPS" -ForegroundColor White
Write-Host "2. SSH into VPS and run:" -ForegroundColor White
Write-Host "   cd /var/www/clanplug" -ForegroundColor Gray
Write-Host "   rm -rf backend" -ForegroundColor Gray
Write-Host "   mkdir -p backend; cd backend" -ForegroundColor Gray
Write-Host "   # Upload backend.tar.gz here" -ForegroundColor Gray
Write-Host "   tar -xzf backend.tar.gz" -ForegroundColor Gray
Write-Host "   cp /var/www/clanplug/.env.production .env" -ForegroundColor Gray
Write-Host "   npm install --production" -ForegroundColor Gray
Write-Host "   pm2 restart clanplug-api" -ForegroundColor Gray
Write-Host "   pm2 logs --lines 100" -ForegroundColor Gray
Write-Host "`n3. Verify Socket.IO:" -ForegroundColor White
Write-Host "   curl http://localhost:4000/socket.io/" -ForegroundColor Gray
Write-Host "   Should return Socket.IO upgrade page, NOT 404" -ForegroundColor Gray

Write-Host "" -ForegroundColor Cyan
Write-Host "Package size:" -ForegroundColor Cyan
$size = (Get-Item "backend.tar.gz").Length / 1MB
$sizeRounded = [math]::Round($size, 2)
Write-Host "Size: $sizeRounded MB" -ForegroundColor White
