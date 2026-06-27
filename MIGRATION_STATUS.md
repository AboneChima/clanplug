# 🚀 ClanPlug VPS Migration Status

**Date:** June 26, 2026  
**VPS IP:** 176.57.189.248  
**Status:** ✅ 70% Complete

---

## ✅ COMPLETED STEPS

### Phase 1: VPS Setup ✅
- [x] Connected to VPS via SSH
- [x] System updated (Ubuntu 24.04)
- [x] Node.js 20 installed
- [x] PostgreSQL installed
- [x] Redis installed
- [x] Nginx installed
- [x] PM2 installed
- [x] Certbot installed
- [x] Firewall configured
- [x] Directories created
- [x] Database created (clanplug)
- [x] Database user created (clanplug_user)

### Phase 2: Code Upload ✅
- [x] Backend code uploaded (backend.zip)
- [x] Frontend code uploaded (frontend.zip)
- [x] Backend extracted
- [x] Frontend extracted
- [x] Backend dependencies installed (442 packages)
- [x] Frontend dependencies installed (443 packages)

---

## 🔄 NEXT STEPS (30 minutes to complete)

### Step 1: Build TypeScript Backend (5 min)
```bash
cd /var/www/clanplug/backend
npm run build
```

### Step 2: Create Environment Files (5 min)

**Backend .env:**
```bash
nano /var/www/clanplug/backend/.env
```

Paste this:
```env
DATABASE_URL=postgresql://clanplug_user:ClanPlug_DB_2024_Secure!@#@localhost:5432/clanplug
PORT=4000
NODE_ENV=production
APP_URL=https://api.clanplug.site
FRONTEND_URL=https://www.clanplug.site

JWT_SECRET=b4642a54edf0375812be8d34bc4f176b22b760d2572e7ec8c97733baf83e4f1b
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=972c971c1bc28c8d8875edf5ff636cd7538eeeb6353ecfa242aec071b6c61bd1
JWT_REFRESH_EXPIRES_IN=30d

REDIS_URL=redis://localhost:6379

UPLOAD_DIR=/var/www/clanplug/uploads
UPLOAD_URL_BASE=https://api.clanplug.site/uploads

FLUTTERWAVE_SECRET_KEY=FLWSECK-0e7bf7febea7c8cbe547fa81ad837267-19a44a027advt-X
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-16afbf00220eb4faec6bea5630fc7ea5-X
FLUTTERWAVE_WEBHOOK_SECRET=sdAsdBBNX5h992LKLxshg3DCccMtytftsx

CLUBKONNECT_USERID=CK101266657
CLUBKONNECT_APIKEY=18V8265C71KTKBO89995TL7WUR30K5XCM0IMPOP4B5Y2UJSV6U9U5372D10T746V
CLUBKONNECT_BASE_URL=https://www.nellobytesystems.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deoraclee@gmail.com
SMTP_PASS=tivplyipbvlwqeha
SMTP_FROM=deoraclee@gmail.com

NOWPAYMENTS_API_KEY=FN8DS05-8ST4E7Q-GTAZHSX-GH9N39Y
NOWPAYMENTS_IPN_SECRET=V/BlBcg7sb2tpd58mvi+Dk02c5NKz3Zw
NOWPAYMENTS_BASE_URL=https://api.nowpayments.io/v1

SUPABASE_URL=https://htfnwvaqrhzcoybphiqk.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Zm53dmFxcmh6Y295YnBoaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk4MTA1NiwiZXhwIjoyMDc4NTU3MDU2fQ.hAdBVtkMcjAu-ZzWHPfuzDcPU-pVNgV-sEJHEGAemug
SUPABASE_BUCKET=uploads
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

**Frontend .env.local:**
```bash
nano /var/www/clanplug/frontend/.env.local
```

Paste:
```env
NEXT_PUBLIC_API_URL=https://api.clanplug.site
NODE_ENV=production
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

### Step 3: Run Database Migrations (2 min)
```bash
cd /var/www/clanplug/backend
npx prisma migrate deploy
npx prisma generate
```

### Step 4: Build Frontend (5 min)
```bash
cd /var/www/clanplug/frontend
npm run build
```

### Step 5: Start Applications with PM2 (2 min)

**Backend:**
```bash
cd /var/www/clanplug/backend
pm2 start dist/server.js --name clanplug-backend -i 2
```

**Frontend:**
```bash
cd /var/www/clanplug/frontend
pm2 start npm --name clanplug-frontend -- start
```

**Save PM2:**
```bash
pm2 save
pm2 startup
```

### Step 6: Configure Nginx (5 min)

```bash
nano /etc/nginx/sites-available/clanplug
```

Paste this configuration:
```nginx
# Backend API
server {
    listen 80;
    server_name api.clanplug.site;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /var/www/clanplug/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Frontend
server {
    listen 80;
    server_name clanplug.site www.clanplug.site;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Save and enable:
```bash
ln -s /etc/nginx/sites-available/clanplug /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### Step 7: Setup SSL (5 min)
```bash
certbot --nginx -d clanplug.site -d www.clanplug.site -d api.clanplug.site --non-interactive --agree-tos -m deoraclee@gmail.com
systemctl reload nginx
```

### Step 8: Test Everything (5 min)
```bash
# Check services
pm2 status
systemctl status nginx

# Test API
curl http://localhost:4000/health

# Test frontend
curl http://localhost:3000
```

---

## 📊 System Resources

```bash
# Check disk space
df -h

# Check memory
free -h

# Check processes
pm2 monit
```

---

## 🔄 Backup Current Render Database

**Before going live, backup your production data:**

On your Windows machine:
```powershell
node backup-render.js
```

Upload backup to VPS:
```powershell
scp backups\clanplug_data_*.json root@176.57.189.248:/var/www/clanplug/backups/
```

---

## 🌐 DNS Update (Do this LAST!)

Only update DNS after everything is working:

1. Login to your domain registrar
2. Update DNS records:
```
Type    Host    Value               TTL
A       @       176.57.189.248      300
A       www     176.57.189.248      300
A       api     176.57.189.248      300
```

3. Wait 5-30 minutes for propagation
4. Test: `nslookup clanplug.site`

---

## ✅ Final Checklist

Before going live:
- [ ] Backend running: `pm2 status`
- [ ] Frontend running: `pm2 status`
- [ ] Database accessible: `psql -U clanplug_user -d clanplug -c "SELECT 1;"`
- [ ] Nginx working: `curl http://176.57.189.248`
- [ ] SSL certificates installed: `certbot certificates`
- [ ] Firewall enabled: `ufw status`
- [ ] Backup created and uploaded
- [ ] DNS updated
- [ ] Site loads: https://www.clanplug.site
- [ ] API responds: https://api.clanplug.site/health

---

## 🆘 Troubleshooting

### Backend won't start
```bash
cd /var/www/clanplug/backend
pm2 logs clanplug-backend --lines 50
```

### Frontend won't start
```bash
cd /var/www/clanplug/frontend
pm2 logs clanplug-frontend --lines 50
```

### Database connection issues
```bash
psql -U clanplug_user -d clanplug
# Password: ClanPlug_DB_2024_Secure!@#
```

### Check Nginx errors
```bash
tail -f /var/log/nginx/error.log
```

---

## 📞 Current Status

**You are here:** ✅ Dependencies installed, ready to build and deploy

**Next:** Follow steps 1-8 above to complete migration

**Time remaining:** ~30 minutes

**VPS Terminal:** Keep it open and connected!

---

**Questions? Issues? Let me know and I'll help!**
