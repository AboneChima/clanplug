# Socket.IO Deployment - Final Steps

## ✅ What's Done:
1. Backend rebuilt with Socket.IO
2. Uploaded to VPS: `/var/www/clanplug/backend.tar.gz`

## 📋 Run These Commands on VPS:

### Step 1: SSH into VPS
```bash
ssh root@176.57.189.248
# Password: Lordmoon123!
```

### Step 2: Deploy Backend
```bash
cd /var/www/clanplug

# Backup existing
[ -d backend ] && mv backend backend_backup_$(date +%Y%m%d_%H%M%S)

# Extract new files
mkdir -p backend && cd backend
tar -xzf ../backend.tar.gz
rm ../backend.tar.gz

# Copy .env if missing
[ ! -f .env ] && cp ../backend_backup*/.env . 2>/dev/null

# Install dependencies (includes socket.io)
npm install --production

# Verify socket.io
ls node_modules/ | grep socket.io

# Restart
pm2 restart clanplug-api

# Wait and check logs
sleep 5
pm2 logs clanplug-api --lines 50 --nostream
```

### Step 3: Verify Socket.IO
```bash
# Should show Socket.IO handshake (not 404)
curl http://localhost:4000/socket.io/ | head -n 10

# Groups API should return 401 (not 404)
curl -i http://localhost:4000/api/groups
```

## ✅ Success Indicators:
- PM2 logs show: `✅ Socket.IO initialized`
- curl socket.io returns Socket.IO content (not 404)
- Groups API returns 401 unauthorized (not 404)
- Frontend console: Socket.IO connects (not 404)

## 🔧 If Issues:
```bash
# Check if socket.io installed
npm list socket.io

# Manually install if needed
npm install socket.io@^4.7.4

# Check dist/socket exists
ls -la dist/socket/

# Full logs
pm2 logs clanplug-api --lines 100
```
