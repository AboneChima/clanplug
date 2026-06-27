# 🗄️ ClanPlug Database Backup

Your database is on **Render PostgreSQL**. Backups are easy!

---

## ⚡ Quick Backup (Right Now!)

### Windows:
**Double-click this file:**
```
backup-now.bat
```

### Or run this command:
```bash
node backup-render.js
```

**That's it!** Your backup will be saved to the `backups/` folder.

---

## 📊 Your Latest Backup

**Date:** June 25, 2026 at 3:09 AM  
**Size:** 14.32 MB  
**Location:** `backups/clanplug_data_2026-06-25_02-09-36.json`

**What's included:**
- ✅ 2,628 users (with wallets, KYC data)
- ✅ 399 posts (with likes, comments)
- ✅ 1,123 chats (with all messages)
- ✅ 291 transactions
- ✅ 8,091 notifications
- ✅ 44 VTU transactions

---

## 🔄 Automatic Daily Backups

### Setup (Windows Task Scheduler):

1. **Open Task Scheduler**
   - Press `Win + R`
   - Type: `taskschd.msc`
   - Press Enter

2. **Create Task**
   - Click "Create Basic Task"
   - Name: "ClanPlug Daily Backup"
   - Trigger: Daily at 2:00 AM
   - Action: Start a program
     - Program: `node`
     - Arguments: `backup-render.js`
     - Start in: `C:\Users\1040 G7\Documents\Lordmoon`

3. **Done!**
   - Your database will backup automatically every day

---

## 📁 Viewing Your Backups

### List all backups:
```bash
node backup-render.js --list
```

### Check backups folder:
```bash
dir backups\
```

---

## ☁️ Upload to Cloud (Recommended)

**Protect your backups by uploading to cloud storage:**

### Google Drive:
1. Install Google Drive desktop app
2. Copy backups folder to Google Drive
3. Backups sync automatically

### OneDrive:
```bash
copy backups\clanplug_data_*.json "C:\Users\1040 G7\OneDrive\ClanPlug Backups\"
```

### Dropbox:
```bash
copy backups\clanplug_data_*.json "C:\Users\1040 G7\Dropbox\ClanPlug Backups\"
```

---

## 🔐 Security

**Important:**
- ⚠️ Backups contain sensitive user data
- ⚠️ Never share backups publicly
- ⚠️ Don't commit to GitHub
- ⚠️ Keep in secure location only

**Your backup includes:**
- User emails and passwords (hashed)
- Transaction history
- Chat messages
- Personal information

---

## 🆘 Restore Database

If you ever need to restore your database, contact me and I'll help you restore from the backup files.

**What to do:**
1. Stop making any changes
2. Find the latest backup in `backups/` folder
3. Contact support with the backup file
4. We'll restore your database

---

## 📞 Render Database Info

**Database:** ClanPlug Production  
**Host:** Render PostgreSQL (Oregon)  
**Type:** PostgreSQL 15  
**Dashboard:** https://dashboard.render.com

### Access Render Dashboard:
1. Go to: https://dashboard.render.com
2. Click "PostgreSQL" in sidebar
3. Select your database
4. View backups, metrics, logs

### Render's Built-in Backups:
- ✅ Daily automatic backups
- ✅ Kept for 7 days
- ✅ One-click restore
- ✅ No extra cost

---

## 💡 Best Practices

### Backup Schedule:
- ✅ **Daily:** Automated backup (2 AM)
- ✅ **Before updates:** Manual backup
- ✅ **Weekly:** Upload to cloud storage
- ✅ **Monthly:** Verify backup integrity

### Storage:
- Keep last 30 backups locally (automatic)
- Upload weekly backup to cloud
- Delete backups older than 90 days from cloud

### Testing:
- Once a month, verify backup file exists
- Check file size is reasonable (>10 MB)
- Keep this README updated

---

## 📈 Backup Size Guide

**Normal backup sizes:**
- 2,000 users: ~10-15 MB
- 5,000 users: ~25-40 MB
- 10,000 users: ~50-80 MB

**If backup is unusually small (<5 MB):**
- Check if backup completed successfully
- Verify database connection
- Run backup again

**If backup is too large (>100 MB):**
- Normal for databases with many users
- Consider compressing old backups
- Archive and delete old data if needed

---

## ✅ Backup Checklist

### Daily (Automated):
- [ ] Backup runs at 2 AM
- [ ] Check backup file created
- [ ] Verify file size is normal

### Weekly:
- [ ] Upload backup to cloud
- [ ] Check Render dashboard
- [ ] Review backup logs

### Monthly:
- [ ] Test backup file integrity
- [ ] Clean up very old backups
- [ ] Update this README if needed

---

## 🎓 Commands Reference

### Create Backup:
```bash
node backup-render.js
```

### List Backups:
```bash
node backup-render.js --list
```

### Help:
```bash
node backup-render.js --help
```

### View Latest Backup:
```bash
dir /O-D backups\ | more
```

---

## 📚 Additional Resources

**Render Documentation:**
- Database Backups: https://render.com/docs/databases#backups
- PostgreSQL Guide: https://render.com/docs/databases

**Support:**
- Render Support: support@render.com
- Dashboard: https://dashboard.render.com
- Status: https://status.render.com

---

**Last Updated:** June 25, 2026  
**Database:** Render PostgreSQL  
**Backup Tool:** backup-render.js  
**Status:** ✅ Working (tested June 25, 2026)
