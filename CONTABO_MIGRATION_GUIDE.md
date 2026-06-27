# 🚀 Complete Migration to Contabo VPS

Complete guide to migrate everything from Render + Vercel + Cloudinary to your Contabo VPS.

---

## 📋 What We're Moving

| Service | From | To |
|---------|------|-----|
| **Backend API** | Render | Contabo VPS |
| **Frontend** | Vercel | Contabo VPS |
| **Database** | Render PostgreSQL | Contabo PostgreSQL |
| **File Storage** | Cloudinary/Supabase | Local Disk (150GB) |
| **Redis** | - | Contabo Redis |
| **SSL** | Automatic | Let's Encrypt (Free) |

---

## 💰 Cost Savings

**Before:**
- Render: $0-7/month (with limits)
- Vercel: $0-20/month (bandwidth limits)
- Cloudinary: $0+ (storage/bandwidth limits)
- **Total:** $0-47/month + overages

**After:**
- Contabo VPS: Fixed price/month
- **No bandwidth limits**
- **No storage limits** (150GB included)
- **Full control**

---

## 🎯 Your VPS Specs

```
Plan: Cloud VPS 10 SSD
CPU: 4 cores
RAM: 8 GB
Storage: 150 GB SSD
Bandwidth: Unlimited
OS: Ubuntu 22.04 LTS
```

**Perfect for:**
- ✅ 10,000+ users
- ✅ Unlimited uploads
- ✅ HD video support
- ✅ Real-time chat
- ✅ Background jobs

---

## 📝 Migration Checklist

### Phase 1: Preparation (Day 1)
- [ ] Access Contabo VPS (get IP, SSH key)
- [ ] Point domain DNS to new IP
- [ ] Backup current database
- [ ] Download all Cloudinary images
- [ ] Test SSH access to VPS

### Phase 2: Server Setup (Day 1)
- [ ] Run contabo-setup.sh
- [ ] Configure PostgreSQL
- [ ] Setup firewall
- [ ] Install SSL certificates

### Phase 3: Application Deployment (Day 2)
- [ ] Upload code to VPS
- [ ] Install dependencies
- [ ] Run database migrations
- [ ] Upload media files
- [ ] Configure environment variables

### Phase 4: DNS & SSL (Day 2)
- [ ] Update DNS records
- [ ] Install SSL certificates
- [ ] Test HTTPS
- [ ] Configure Nginx

### Phase 5: Testing (Day 3)
- [ ] Test all features
- [ ] Verify uploads work
- [ ] Check database connection
- [ ] Monitor performance
- [ ] Fix any issues

### Phase 6: Go Live (Day 3)
- [ ] Final backup of old system
- [ ] Switch DNS to VPS
- [ ] Monitor for 24 hours
- [ ] Deactivate old services

---

## 🚀 Step-by-Step Migration

### Step 1: Connect to Your VPS

**Get your Contabo details from email:**
- IP Address
- Root password
- SSH access

**Connect via SSH:**
```bash
ssh root@YOUR_VPS_IP
# Enter password from Contabo email
```

**Or use PuTTY on Windows:**
1. Download PuTTY
2. Enter VPS IP
3. Login as: root
4. Enter password

---

### Step 2: Initial Server Setup

**Upload setup script to VPS:**
```bash
# On your local machine
scp contabo-setup.sh root@YOUR_VPS_IP:/root/

# On VPS
cd /root
chmod +x contabo-setup.sh
bash contabo-setup.sh
```

**This installs:**
- ✅ Node.js 20
- ✅ PostgreSQL 15
- ✅ Redis
- ✅ Nginx
- ✅ PM2
- ✅ Certbot (SSL)
- ✅ Security (Firewall)

**Time:** ~15-20 minutes

---

### Step 3: Backup Current Database

**On your local machine:**
```bash
# Backup from Render
node backup-render.js

# This creates: backups/clanplug_data_YYYY-MM-DD.json
```

**Upload to VPS:**
```bash
scp backups/clanplug_data_*.json root@YOUR_VPS_IP:/var/www/clanplug/backups/
```

---

### Step 4: Download Cloudinary/Supabase Images

**Create download script:**

```javascript
// download-cloudinary-images.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllImages() {
  // Create download directory
  const downloadDir = './downloaded-images';
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // Get all posts with images
  const posts = await prisma.post.findMany({
    where: {
      images: { not: null }
    }
  });

  let downloaded = 0;
  for (const post of posts) {
    if (post.images && Array.isArray(post.images)) {
      for (const imageUrl of post.images) {
        try {
          const filename = path.basename(new URL(imageUrl).pathname);
          const filepath = path.join(downloadDir, filename);
          
          if (!fs.existsSync(filepath)) {
            await downloadImage(imageUrl, filepath);
            downloaded++;
            console.log(`✓ Downloaded: ${filename}`);
          }
        } catch (error) {
          console.error(`✗ Failed: ${imageUrl}`);
        }
      }
    }
  }

  console.log(`\n✅ Downloaded ${downloaded} images`);
}

downloadAllImages();
```

**Run it:**
```bash
node download-cloudinary-images.js
```

**Upload to VPS:**
```bash
scp -r downloaded-images/* root@YOUR_VPS_IP:/var/www/clanplug/uploads/images/
```

---

### Step 5: Deploy Application

**Upload your code:**
```bash
# Backend
cd /path/to/Lordmoon
tar -czf backend.tar.gz src prisma package.json tsconfig.json
scp backend.tar.gz root@YOUR_VPS_IP:/var/www/clanplug/

# Frontend
cd web
tar -czf frontend.tar.gz src public package.json next.config.js
scp frontend.tar.gz root@YOUR_VPS_IP:/var/www/clanplug/
```

**On VPS, extract and setup:**
```bash
cd /var/www/clanplug/backend
tar -xzf ../backend.tar.gz
npm install

cd /var/www/clanplug/frontend
tar -xzf ../frontend.tar.gz
npm install
```

---

### Step 6: Configure Environment Variables

**Backend .env:**
```bash
cat > /var/www/clanplug/backend/.env <<EOF
# Database
DATABASE_URL=postgresql://clanplug_user:YOUR_PASSWORD@localhost:5432/clanplug

# Server
PORT=4000
NODE_ENV=production
APP_URL=https://api.clanplug.site
FRONTEND_URL=https://www.clanplug.site

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# File Storage (Local)
UPLOAD_DIR=/var/www/clanplug/uploads
UPLOAD_URL_BASE=https://api.clanplug.site/uploads

# Payment APIs
FLUTTERWAVE_SECRET_KEY=FLWSECK-0e7bf7febea7c8cbe547fa81ad837267-19a44a027advt-X
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-16afbf00220eb4faec6bea5630fc7ea5-X

# VTU
CLUBKONNECT_USERID=CK101266657
CLUBKONNECT_APIKEY=18V8265C71KTKBO89995TL7WUR30K5XCM0IMPOP4B5Y2UJSV6U9U5372D10T746V
CLUBKONNECT_BASE_URL=https://www.nellobytesystems.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deoraclee@gmail.com
SMTP_PASS=tivplyipbvlwqeha
SMTP_FROM=deoraclee@gmail.com
EOF
```

**Frontend .env.local:**
```bash
cat > /var/www/clanplug/frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL=https://api.clanplug.site
NODE_ENV=production
EOF
```

---

### Step 7: Deploy with PM2

**Upload and run deploy script:**
```bash
scp deploy-to-contabo.sh root@YOUR_VPS_IP:/root/
ssh root@YOUR_VPS_IP
bash /root/deploy-to-contabo.sh
```

**Check status:**
```bash
pm2 status
pm2 logs clanplug-backend
pm2 logs clanplug-frontend
```

---

### Step 8: Configure Nginx

```bash
bash setup-nginx.sh
```

**Test Nginx:**
```bash
nginx -t
systemctl status nginx
```

---

### Step 9: Setup SSL (HTTPS)

**Create SSL setup script:**
```bash
cat > setup-ssl.sh <<'EOF'
#!/bin/bash
certbot --nginx -d clanplug.site -d www.clanplug.site -d api.clanplug.site --non-interactive --agree-tos -m your-email@example.com
systemctl reload nginx
EOF

chmod +x setup-ssl.sh
bash setup-ssl.sh
```

**Test HTTPS:**
```bash
curl https://api.clanplug.site/health
curl https://www.clanplug.site
```

---

### Step 10: Update DNS Records

**In your domain registrar (Namecheap, GoDaddy, etc.):**

```
Type    Host    Value               TTL
A       @       YOUR_VPS_IP         300
A       www     YOUR_VPS_IP         300
A       api     YOUR_VPS_IP         300
```

**Wait for DNS propagation (5-30 minutes)**

**Check DNS:**
```bash
nslookup clanplug.site
nslookup api.clanplug.site
```

---

### Step 11: Restore Database

**On VPS:**
```bash
cd /var/www/clanplug/backend

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Restore data from backup
node restore-backup.js /var/www/clanplug/backups/clanplug_data_*.json
```

---

### Step 12: Update Upload Service

**Update your post controller to use local storage:**

```typescript
// src/controllers/post.controller.ts
import localStorageService from '../services/local-storage.service';

// Replace Cloudinary upload with local storage
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    localStorageService.uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Optimize image
      if (file.mimetype.startsWith('image/')) {
        await localStorageService.optimizeImage(file.path);
      }

      // Get public URL
      const url = localStorageService.getFileUrl(file.path);

      res.json({
        success: true,
        data: { url, urls: [url] }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
};
```

---

## 🔒 Security Checklist

After migration, verify:

- [ ] Firewall enabled (UFW)
- [ ] Only ports 22, 80, 443 open
- [ ] PostgreSQL not accessible from internet
- [ ] Redis not accessible from internet
- [ ] SSL certificates installed
- [ ] Strong database password set
- [ ] fail2ban configured (blocks brute force)
- [ ] Regular backups scheduled

---

## 📊 Monitoring & Maintenance

### Check Application Status
```bash
pm2 status
pm2 logs
```

### Check Disk Usage
```bash
df -h
du -sh /var/www/clanplug/uploads/*
```

### Check Memory Usage
```bash
free -h
```

### Check Database Size
```bash
sudo -u postgres psql -d clanplug -c "SELECT pg_size_pretty(pg_database_size('clanplug'));"
```

### Restart Services
```bash
pm2 restart all
systemctl restart nginx
systemctl restart postgresql
systemctl restart redis
```

---

## 🆘 Troubleshooting

### Backend not starting
```bash
cd /var/www/clanplug/backend
pm2 logs clanplug-backend --lines 100
```

### Frontend not loading
```bash
cd /var/www/clanplug/frontend
pm2 logs clanplug-frontend --lines 100
```

### Database connection issues
```bash
# Test database connection
sudo -u postgres psql -d clanplug -c "SELECT version();"

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

### SSL not working
```bash
certbot renew --dry-run
nginx -t
systemctl status nginx
```

### Upload not working
```bash
# Check permissions
ls -la /var/www/clanplug/uploads/
chmod -R 755 /var/www/clanplug/uploads/
chown -R www-data:www-data /var/www/clanplug/uploads/
```

---

## 📈 Performance Optimization

### Enable Nginx Caching
```nginx
# Add to /etc/nginx/nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m;
```

### Enable Gzip Compression
```nginx
# Add to /etc/nginx/nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Setup Redis Caching
```typescript
// In your backend
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
await redis.set('key', JSON.stringify(data), 'EX', 3600);
```

---

## 🔄 Backup Strategy on VPS

### Automated Daily Backups
```bash
# Create backup script
cat > /root/backup-all.sh <<'EOF'
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

chmod +x /root/backup-all.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-all.sh
```

---

## ✅ Post-Migration Checklist

- [ ] All pages loading correctly
- [ ] User login working
- [ ] Image uploads working
- [ ] Video uploads working  
- [ ] Chat functioning
- [ ] Marketplace working
- [ ] Payments processing
- [ ] VTU services working
- [ ] Email notifications sending
- [ ] SSL certificate valid
- [ ] Database accessible
- [ ] Backups running
- [ ] Monitoring setup

---

## 📞 Need Help?

If you encounter any issues during migration:
1. Check the troubleshooting section
2. Review PM2 logs: `pm2 logs`
3. Check Nginx logs: `tail -f /var/log/nginx/error.log`
4. Verify environment variables are set correctly

---

**Estimated Total Migration Time:** 2-3 days
**Downtime Required:** ~2-4 hours (during DNS switch)
**Difficulty:** Intermediate

**Ready to start? Let's begin with Step 1!**
