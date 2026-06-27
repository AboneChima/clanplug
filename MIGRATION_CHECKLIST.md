# ✅ ClanPlug VPS Migration Checklist

Complete checklist for migrating to Contabo VPS: **176.57.189.248**

---

## 🎯 Phase 1: Initial Setup (30 minutes)

### Connect to VPS
- [ ] Open PuTTY or Command Prompt
- [ ] Connect: `ssh root@176.57.189.248`
- [ ] Login with password: `wK6Pf7D2i5pH`
- [ ] Connection successful

### Secure the Server
- [ ] Change root password: `passwd`
- [ ] New password saved securely
- [ ] Test new password by disconnecting and reconnecting

### Run Setup Script
- [ ] Upload script: `scp contabo-setup.sh root@176.57.189.248:/root/`
- [ ] Make executable: `chmod +x /root/contabo-setup.sh`
- [ ] Run: `bash /root/contabo-setup.sh`
- [ ] Wait for completion (15-20 min)
- [ ] See "✅ VPS Setup Complete!" message

**Status:** ⬜ Not Started

---

## 🎯 Phase 2: DNS Configuration (5 minutes)

### Update Domain DNS
- [ ] Login to domain registrar
- [ ] Update A record `@` → `176.57.189.248`
- [ ] Update A record `www` → `176.57.189.248`
- [ ] Update A record `api` → `176.57.189.248`
- [ ] Delete old Vercel/Render records
- [ ] Wait for DNS propagation (check: `nslookup clanplug.site`)

**Status:** ⬜ Not Started

---

## 🎯 Phase 3: Backup Current Data (15 minutes)

### Backup Database
- [ ] Run: `node backup-render.js`
- [ ] Backup file created in `backups/` folder
- [ ] Upload to VPS: `scp backups/clanplug_data_*.json root@176.57.189.248:/var/www/clanplug/backups/`

### Download Cloudinary Images (Optional)
- [ ] Run: `node download-cloudinary-images.js`
- [ ] Images downloaded to `downloaded-images/`
- [ ] Upload to VPS: `scp -r downloaded-images/* root@176.57.189.248:/var/www/clanplug/uploads/images/`

**Status:** ⬜ Not Started

---

## 🎯 Phase 4: Deploy Application (30 minutes)

### Upload Code
- [ ] Run: `upload-to-vps.bat` (or use commands below)
- [ ] Backend uploaded
- [ ] Frontend uploaded
- [ ] Setup scripts uploaded

**Manual Upload Commands:**
```powershell
# Compress
tar -czf backend.tar.gz src prisma package.json tsconfig.json
cd web && tar -czf frontend.tar.gz src public package.json next.config.js

# Upload
scp backend.tar.gz root@176.57.189.248:/var/www/clanplug/
scp web/frontend.tar.gz root@176.57.189.248:/var/www/clanplug/
```

### Extract on VPS
```bash
# On VPS
cd /var/www/clanplug/backend
tar -xzf ../backend.tar.gz

cd /var/www/clanplug/frontend
tar -xzf ../frontend.tar.gz
```

- [ ] Files extracted on VPS
- [ ] Directories verified: `ls -la /var/www/clanplug/`

### Deploy Applications
```bash
# On VPS
bash /root/deploy-to-contabo.sh
```

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database migrations run
- [ ] PM2 processes started
- [ ] Check status: `pm2 status`

**Status:** ⬜ Not Started

---

## 🎯 Phase 5: Configure Web Server (10 minutes)

### Setup Nginx
```bash
# On VPS
bash /root/setup-nginx.sh
```

- [ ] Nginx configured
- [ ] Configuration test passed: `nginx -t`
- [ ] Nginx reloaded
- [ ] Test: `curl http://176.57.189.248`

### Setup SSL Certificates
```bash
# On VPS
certbot --nginx -d clanplug.site -d www.clanplug.site -d api.clanplug.site --non-interactive --agree-tos -m YOUR_EMAIL@example.com
systemctl reload nginx
```

- [ ] SSL certificates installed
- [ ] Test: `curl https://clanplug.site`
- [ ] Test: `curl https://api.clanplug.site/health`

**Status:** ⬜ Not Started

---

## 🎯 Phase 6: Configure Environment (15 minutes)

### Backend Environment Variables
```bash
# On VPS
nano /var/www/clanplug/backend/.env
```

**Add these variables:**
```env
DATABASE_URL=postgresql://clanplug_user:ClanPlug_DB_2024_Secure!@#@localhost:5432/clanplug
PORT=4000
NODE_ENV=production
APP_URL=https://api.clanplug.site
FRONTEND_URL=https://www.clanplug.site

JWT_SECRET=<generate with: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate with: openssl rand -hex 32>
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

- [ ] Backend .env created
- [ ] All variables set

### Frontend Environment Variables
```bash
# On VPS
nano /var/www/clanplug/frontend/.env.local
```

**Add:**
```env
NEXT_PUBLIC_API_URL=https://api.clanplug.site
NODE_ENV=production
```

- [ ] Frontend .env created
- [ ] API URL set correctly

### Restart Applications
```bash
pm2 restart all
pm2 save
```

- [ ] Applications restarted
- [ ] PM2 configuration saved

**Status:** ⬜ Not Started

---

## 🎯 Phase 7: Restore Database (10 minutes)

### Import Database
```bash
# On VPS
cd /var/www/clanplug/backend

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Restore data (if you have backup)
# Create restore script or manually import
```

- [ ] Database migrations applied
- [ ] Prisma client generated
- [ ] Data restored (if applicable)
- [ ] Test: `psql -U clanplug_user -d clanplug -c "SELECT COUNT(*) FROM \"User\";"`

**Status:** ⬜ Not Started

---

## 🎯 Phase 8: Testing (30 minutes)

### Backend API Tests
- [ ] Health check: `curl https://api.clanplug.site/health`
- [ ] Login endpoint works
- [ ] User registration works
- [ ] Database queries working

### Frontend Tests
- [ ] Visit: https://www.clanplug.site
- [ ] Homepage loads
- [ ] Login page works
- [ ] User can login
- [ ] Images load correctly

### Feature Tests
- [ ] User registration
- [ ] User login
- [ ] Post creation
- [ ] Image upload (new local storage)
- [ ] Video upload
- [ ] Marketplace listings
- [ ] Chat messages
- [ ] VTU services
- [ ] Wallet transactions
- [ ] Profile updates

### Performance Tests
- [ ] Page load speed acceptable
- [ ] API response times good
- [ ] Image serving fast
- [ ] No console errors

**Status:** ⬜ Not Started

---

## 🎯 Phase 9: Monitoring Setup (15 minutes)

### Setup Automated Backups
```bash
# On VPS
cat > /root/backup-daily.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/clanplug/backups"
DATE=$(date +%Y-%m-%d)

# Backup database
sudo -u postgres pg_dump clanplug > "$BACKUP_DIR/db_$DATE.sql"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /var/www/clanplug/uploads/

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup-daily.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /root/backup-daily.sh
```

- [ ] Backup script created
- [ ] Cron job scheduled
- [ ] Test backup: `bash /root/backup-daily.sh`

### Setup Monitoring
```bash
# Install monitoring tools
apt install -y htop iotop nethogs
```

- [ ] Monitoring tools installed
- [ ] PM2 monitoring: `pm2 monit`
- [ ] System resources: `htop`

**Status:** ⬜ Not Started

---

## 🎯 Phase 10: Go Live (1 hour monitoring)

### Final Checks
- [ ] All DNS records updated
- [ ] SSL certificates valid
- [ ] All services running: `pm2 status`
- [ ] Database accessible
- [ ] Uploads working
- [ ] No error logs: `pm2 logs --err`

### Deactivate Old Services
- [ ] Stop Render backend (or keep as backup for 1 week)
- [ ] Remove Vercel deployment (or keep as backup)
- [ ] Keep Cloudinary for old images (optional)

### Monitor for Issues
- [ ] Monitor for 1 hour: `pm2 logs`
- [ ] Check error logs: `tail -f /var/log/nginx/error.log`
- [ ] Test critical features every 15 minutes
- [ ] Monitor server resources: `htop`

**Status:** ⬜ Not Started

---

## 🎯 Post-Migration (Ongoing)

### Daily Monitoring
- [ ] Check PM2 status: `pm2 status`
- [ ] Check disk space: `df -h`
- [ ] Check memory: `free -h`
- [ ] Review logs: `pm2 logs --lines 50`

### Weekly Tasks
- [ ] Review backups
- [ ] Check SSL expiry: `certbot certificates`
- [ ] Update packages: `apt update && apt upgrade`
- [ ] Clean old backups

### Monthly Tasks
- [ ] Review security logs
- [ ] Update Node.js packages: `npm update`
- [ ] Database optimization
- [ ] Storage cleanup

**Status:** ⬜ Not Started

---

## 📊 Migration Progress

```
Phase 1: Initial Setup        ⬜ 0%
Phase 2: DNS Configuration    ⬜ 0%
Phase 3: Backup Data          ⬜ 0%
Phase 4: Deploy Application   ⬜ 0%
Phase 5: Configure Web Server ⬜ 0%
Phase 6: Environment Setup    ⬜ 0%
Phase 7: Restore Database     ⬜ 0%
Phase 8: Testing              ⬜ 0%
Phase 9: Monitoring Setup     ⬜ 0%
Phase 10: Go Live             ⬜ 0%

Overall Progress: 0%
```

---

## 🆘 Emergency Rollback Plan

If something goes wrong:

1. **Revert DNS** to Vercel/Render IPs
2. **Restart old services**
3. **Debug VPS** without affecting users
4. **Try migration again** once fixed

Old service IPs (keep for 1 week):
- Render: Check dashboard
- Vercel: Check dashboard

---

## ✅ Success Criteria

Migration is successful when:
- ✅ Website loads on https://www.clanplug.site
- ✅ API responds on https://api.clanplug.site
- ✅ Users can login
- ✅ Images/videos upload successfully
- ✅ All features working
- ✅ No errors in logs
- ✅ Performance acceptable
- ✅ Backups running

---

**Ready to start? Begin with Phase 1!**

**Current Status:** 🟡 Ready to Begin
**Target Completion:** 2-3 days
**Next Step:** Connect to VPS and run setup script
