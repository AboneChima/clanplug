# 🗄️ Database Backup Guide

Complete guide for backing up your ClanPlug database and backend code.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Backup Methods](#backup-methods)
3. [Supabase Dashboard Backup](#supabase-dashboard-backup)
4. [Automated Backups](#automated-backups)
5. [Restore Instructions](#restore-instructions)
6. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Method 1: Simple JSON Backup (Recommended - No Tools Required)

```bash
# Set production database URL
set DIRECT_URL=postgresql://postgres.htfnwvaqrhzcoybphiqk:Abonechima10.@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

# Run backup
node backup-supabase-simple.js
```

This creates a JSON file in the `backups/` folder with all your data.

### Method 2: SQL Dump (Requires PostgreSQL Tools)

```bash
# Set production database URL
set DIRECT_URL=postgresql://postgres.htfnwvaqrhzcoybphiqk:Abonechima10.@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

# Run backup
node backup-database.js
```

This creates a SQL file that can be restored directly to PostgreSQL.

---

## 🔧 Backup Methods

### 1️⃣ Simple JSON Backup (backup-supabase-simple.js)

**Advantages:**
- ✅ No external tools required
- ✅ Easy to read and inspect
- ✅ Works on any system
- ✅ Includes all relationships
- ✅ Human-readable format

**What it backs up:**
- Users (with profiles, wallets, KYC)
- Posts (with likes and comments)
- Marketplace listings
- Chats and messages
- Transactions
- Notifications
- VTU transactions

**Usage:**
```bash
# Create backup
node backup-supabase-simple.js

# List all backups
node backup-supabase-simple.js --list

# Help
node backup-supabase-simple.js --help
```

**Backup Location:**
```
C:\Users\1040 G7\Documents\Lordmoon\backups\clanplug_data_YYYY-MM-DD_HH-MM-SS.json
```

---

### 2️⃣ SQL Dump Backup (backup-database.js)

**Advantages:**
- ✅ Complete database structure
- ✅ Native PostgreSQL format
- ✅ Easy to restore to any PostgreSQL
- ✅ Smaller file size (compressed)
- ✅ Industry standard

**Requirements:**
- PostgreSQL client tools (pg_dump)

**Installation:**

**Windows:**
1. Download PostgreSQL: https://www.postgresql.org/download/windows/
2. Install with default options
3. Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

**macOS:**
```bash
brew install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

**Usage:**
```bash
# Create backup
node backup-database.js

# List all backups
node backup-database.js --list

# Help
node backup-database.js --help
```

**Backup Location:**
```
C:\Users\1040 G7\Documents\Lordmoon\backups\clanplug_backup_YYYY-MM-DD_HH-MM-SS.sql
```

---

### 3️⃣ Supabase Dashboard Backup (Manual)

**Steps:**

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Login with your account

2. **Select Your Project**
   - Project: `htfnwvaqrhzcoybphiqk`
   - Name: Your ClanPlug project

3. **Database Backups**
   - Click "Database" in sidebar
   - Go to "Backups" tab
   - Click "Create Backup"
   - Name it: `manual-backup-YYYY-MM-DD`

4. **Download Backup**
   - Wait for backup to complete
   - Click "Download" button
   - Save to safe location

**Note:** Supabase free plan includes:
- Daily automatic backups (kept for 7 days)
- Point-in-time recovery (last 7 days)

---

### 4️⃣ GitHub Backup (Code Only)

Your code is already backed up on GitHub, but here's how to ensure it:

```bash
# Check remote
git remote -v

# Add all changes
git add .

# Commit
git commit -m "Backup: $(date '+%Y-%m-%d %H:%M:%S')"

# Push to GitHub
git push origin main
```

---

## ⚙️ Automated Backups

### Windows Task Scheduler

**Create Daily Automated Backup:**

1. Open Task Scheduler
   - Press `Win + R`
   - Type: `taskschd.msc`
   - Press Enter

2. Create Basic Task
   - Click "Create Basic Task"
   - Name: "ClanPlug Database Backup"
   - Description: "Daily backup of ClanPlug database"

3. Set Trigger
   - Daily
   - Time: 2:00 AM (or when server is least busy)

4. Set Action
   - Start a Program
   - Program: `node`
   - Arguments: `backup-supabase-simple.js`
   - Start in: `C:\Users\1040 G7\Documents\Lordmoon`

5. Finish
   - Check "Open Properties" for final review
   - Click Finish

**Test the Task:**
- Right-click the task
- Select "Run"
- Check `backups/` folder for new file

---

### Linux/macOS Cron Job

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * cd /path/to/Lordmoon && node backup-supabase-simple.js >> backup.log 2>&1
```

---

## 🔄 Restore Instructions

### Restore from JSON Backup

Create a restore script or manually import:

```javascript
// restore-backup.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restore(backupFile) {
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  
  console.log('⚠️ WARNING: This will clear existing data!');
  console.log('Press Ctrl+C to cancel, Enter to continue...');
  
  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  console.log('🗑️ Clearing existing data...');
  
  // Clear in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.vTUTransaction.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  
  console.log('📥 Restoring data...');
  
  // Restore users first
  for (const user of data.data.users) {
    await prisma.user.create({ data: user });
  }
  
  // Then other data...
  // (Add more restore logic as needed)
  
  console.log('✅ Restore complete!');
  await prisma.$disconnect();
}

restore(process.argv[2]);
```

**Usage:**
```bash
node restore-backup.js backups/clanplug_data_2024-06-25_14-30-00.json
```

---

### Restore from SQL Backup

**Using psql:**

```bash
# Set password
set PGPASSWORD=Abonechima10.

# Restore database
psql -h aws-1-eu-north-1.pooler.supabase.com -p 5432 -U postgres.htfnwvaqrhzcoybphiqk -d postgres -f backups/clanplug_backup_2024-06-25_14-30-00.sql
```

**Using Supabase Dashboard:**

1. Go to Supabase Dashboard
2. Click "Database" → "Backups"
3. Select backup to restore
4. Click "Restore"
5. Confirm restoration

---

## 🎯 Best Practices

### Backup Frequency

**Recommended Schedule:**
- ✅ **Daily:** Automated JSON backup (2 AM)
- ✅ **Weekly:** SQL dump backup (Sunday 2 AM)
- ✅ **Before major changes:** Manual backup
- ✅ **Before deployment:** Manual backup
- ✅ **After important updates:** Manual backup

### Backup Storage

**Local Storage:**
- Keep backups in `backups/` folder
- Automatically keeps last 30 backups
- Older backups are auto-deleted

**Cloud Storage (Recommended):**

Upload backups to cloud for safety:

**Google Drive:**
```bash
# Upload to Google Drive
# (Manual - use Google Drive desktop app)
```

**Dropbox:**
```bash
# Copy to Dropbox folder
copy backups\latest.json "C:\Users\1040 G7\Dropbox\ClanPlug Backups\"
```

**OneDrive:**
```bash
# Copy to OneDrive
copy backups\latest.json "C:\Users\1040 G7\OneDrive\ClanPlug Backups\"
```

### Backup Verification

Always verify backups are working:

```bash
# Check backup file size (should be > 1KB)
dir backups\

# View backup summary
node backup-supabase-simple.js --list

# Test restore on development database
# (Create test script)
```

### Security

**Protect Your Backups:**
- ⚠️ Backups contain sensitive user data
- ⚠️ Never share backups publicly
- ⚠️ Encrypt backups before cloud upload
- ⚠️ Use strong passwords for backup storage
- ⚠️ Keep backup credentials secure

**Encryption (Optional):**

```bash
# Encrypt backup with 7-Zip
"C:\Program Files\7-Zip\7z.exe" a -p -mhe=on backups\encrypted.7z backups\latest.json

# This will prompt for password
# Use strong password and store securely
```

---

## 📊 Backup Monitoring

### Check Backup Status

```bash
# List all backups
node backup-supabase-simple.js --list

# Check last backup
dir /O-D backups\ | more
```

### Backup Size Guidelines

**Normal backup sizes:**
- New database: 10-50 KB
- 100 users: 500 KB - 2 MB
- 1,000 users: 5-20 MB
- 10,000 users: 50-200 MB

**If backup is too small:**
- Check if backup completed
- Verify database connection
- Check for errors in console

**If backup is too large:**
- Check for excessive data
- Review attachment storage
- Consider data archival

---

## 🆘 Emergency Recovery

### If Database is Deleted/Corrupted:

1. **Stop all services immediately**
2. **Don't make any changes**
3. **Find latest backup:**
   ```bash
   node backup-supabase-simple.js --list
   ```

4. **Contact Supabase Support:**
   - support@supabase.com
   - They may have point-in-time recovery

5. **Restore from backup:**
   ```bash
   # Use latest backup
   node restore-backup.js backups\clanplug_data_LATEST.json
   ```

6. **Verify restoration:**
   - Check user count
   - Verify transactions
   - Test login functionality

7. **Resume services**

---

## 📞 Support

**Backup Issues:**
- Check backup scripts are up to date
- Verify database connection
- Check Prisma schema matches database

**Supabase Support:**
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Support: support@supabase.com

**Database Connection Issues:**
- Verify DIRECT_URL is correct
- Check IP whitelist in Supabase
- Test connection with psql

---

## ✅ Backup Checklist

### Daily:
- [ ] Automated backup ran successfully
- [ ] Backup file exists in `backups/` folder
- [ ] Backup size looks normal

### Weekly:
- [ ] Review all backups
- [ ] Test restore on development database
- [ ] Upload backup to cloud storage
- [ ] Verify backup file integrity

### Monthly:
- [ ] Review backup retention policy
- [ ] Clean up very old backups
- [ ] Update backup scripts if needed
- [ ] Test full disaster recovery

---

## 🎓 Additional Resources

**Supabase Documentation:**
- Backups: https://supabase.com/docs/guides/platform/backups
- Database: https://supabase.com/docs/guides/database

**PostgreSQL Documentation:**
- pg_dump: https://www.postgresql.org/docs/current/app-pgdump.html
- Backup & Restore: https://www.postgresql.org/docs/current/backup.html

**Prisma Documentation:**
- Database Seeding: https://www.prisma.io/docs/guides/database/seed-database

---

**Last Updated:** June 25, 2026  
**Version:** 1.0  
**Database:** Supabase PostgreSQL  
**Project:** ClanPlug
