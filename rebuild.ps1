# Clean and rebuild
Write-Host "Cleaning dist folder..."
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Building TypeScript..."
$env:NODE_OPTIONS="--max-old-space-size=460"
npx tsc

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!"
    exit 1
}

Write-Host "Verifying files..."
if (-not (Test-Path "dist/socket/socket.js")) {
    Write-Host "Socket.IO file missing!"
    exit 1
}

if (-not (Test-Path "dist/routes/group.routes.js")) {
    Write-Host "Group routes missing!"
    exit 1
}

Write-Host "Creating deployment package..."
Remove-Item "backend.tar.gz" -ErrorAction SilentlyContinue

# Don't include node_modules - too big, will install on VPS
tar -czf backend.tar.gz dist prisma package.json package-lock.json .env.production

Write-Host "Build complete! Package created: backend.tar.gz"
