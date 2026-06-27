# 🗄️ Render Database Backup Guide

Your ClanPlug database is hosted on **Render PostgreSQL**. Here's how to back it up.

---

## 🚀 Quick Backup Options

### Option 1: Render Dashboard (Easiest)

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com
   - Login to your account

2. **Navigate to Your Database**
   - Click "PostgreSQL" in the left sidebar
   - Select your ClanPlug database

3. **Create Manual Backup**
   - Click "Backups" tab
   - Click "Create Backup" button
   - Name it: `manual-backup-YYYY-MM-DD`
   - Wait for completion

4. **Download Backup**
   - Click "Download" next to the backup
   - Save to safe location

**Render Free Tier Includes:**
- ✅ Daily automatic backups (kept for 7 days)
- ✅ Manual backups on demand
- ✅ Easy one-click restore

---

### Option 2: Automated Backup Script

**Step 1: Get Your Database URL**

From Render Dashboard:
1. Go to your PostgreSQL database
2. Click "Connect" → "External Connection"
3. Copy the "External Database URL"
   - Format: `postgresql://user:password@hostname.render.com:5432/dbname`

**Step 2: Set Environment Variable**

Windows:
```bash
set RENDER_DATABASE_URL=postgresql://user:password@hostname.render.com:5432/dbname
```

**Step 3: Run Backup**

```bash
# Simple JSON backup (no tools needed)
node backup-render-simple.js

# Or SQL dump (requires pg_dump)
node backup-render-sql.js
```

---

## 📝 Backup Scripts

I'll create these scripts once you provide your Render database URL:

### backup-render-simple.js
- Exports all data as JSON
- No PostgreSQL tools required
- Easy to run on any system
- Includes all tables and relationships

### backup-render-sql.js  
- Creates PostgreSQL SQL dump
- Requires pg_dump installed
- Industry standard format
- Easy to restore anywhere

---

## 🔐 Finding Your Render Database URL

### From Render Dashboard:

1. **Login to Render**
   - https://dashboard.render.com

2. **Find Your Database**
   - Sidebar → "PostgreSQL"
   - Click on your database name

3. **Get Connection String**
   - Look for "Connections" or "Connect" section
   - Copy "External Database URL"
   - It looks like: `postgresql://username:password@hostname.render.com:5432/database_name`

4. **Security Note**
   - ⚠️ Keep this URL secret
   - ⚠️ It contains your database password
   - ⚠️ Don't commit to GitHub
   - ⚠️ Store in .env file only

---

## 📋 Render Database Information

**What You Need to Find:**

```
Database Name: _____________
Host: _______________.render.com  
Port: 5432
Username: _______________
Password: ***************
Connection URL: postgresql://_______________
```

**Where to Find It:**
- Render Dashboard → PostgreSQL → Your Database → "Connect"

---

## 🔄 Backup Methods Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Render Dashboard** | ✅ Easy<br>✅ No coding<br>✅ Built-in | ❌ Manual process<br>❌ Can't automate | Quick manual backups |
| **JSON Script** | ✅ No tools needed<br>✅ Easy to inspect<br>✅ Can automate | ❌ Larger file size | Regular automated backups |
| **SQL Dump** | ✅ Standard format<br>✅ Smaller size<br>✅ Easy restore | ❌ Needs pg_dump | Professional backups |

---

## ⚡ Next Steps

**To enable automated backups:**

1. **Provide your Render database URL**
   - From Render Dashboard → PostgreSQL → Connect
   - Send it privately (it contains password)

2. **I'll update the backup scripts**
   - Configure for Render database
   - Test the connection
   - Create automated backup scripts

3. **Set up scheduled backups**
   - Windows Task Scheduler (daily at 2 AM)
   - Or manual backups when needed

---

## 🆘 Emergency: Database Issues

**If your Render database has issues:**

1. **Check Render Status**
   - https://status.render.com
   - Check for outages

2. **Render Support**
   - Dashboard → Help → Contact Support
   - Response time: Usually within 24 hours
   - Free tier: Email support

3. **Restore from Backup**
   - Dashboard → PostgreSQL → Backups
   - Select backup to restore
   - Click "Restore"

4. **Contact Render**
   - support@render.com
   - Include: Database name, issue description, time occurred

---

## 💡 Render Free Tier Limits

**Your current plan includes:**
- ✅ 256 MB storage
- ✅ 1 GB outbound data transfer
- ✅ Daily automatic backups (7-day retention)
- ✅ 90-day snapshot retention
- ✅ Connection pooling

**Storage Usage:**
- Check in Dashboard → PostgreSQL → Overview
- Shows current usage and limit

**If approaching limits:**
- Consider upgrading to paid plan ($7/month)
- Or clean up old data periodically

---

## 📊 Monitoring Your Database

### Check Database Size

From Render Dashboard:
1. Go to PostgreSQL database
2. Check "Overview" tab
3. See "Database Size" metric

### Check Connection Count

1. Dashboard → PostgreSQL → Metrics
2. View "Connections" graph
3. Monitor active connections

---

## 🔒 Security Best Practices

### Database URL Security

**Never:**
- ❌ Commit to GitHub
- ❌ Share in public channels
- ❌ Include in frontend code
- ❌ Log in plain text

**Always:**
- ✅ Store in .env files
- ✅ Use environment variables
- ✅ Keep backups encrypted
- ✅ Rotate passwords periodically

### Access Control

**Render provides:**
- IP whitelisting (paid plans)
- SSL/TLS encryption (automatic)
- Read-only user creation
- Connection limits

---

## 📞 Support Contacts

**Render Support:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs/databases
- Support: support@render.com
- Status: https://status.render.com

**Community:**
- Discord: https://discord.gg/render
- Forum: https://community.render.com

---

## ✅ Current Status

- [x] Database hosted on Render
- [ ] Backup scripts configured
- [ ] Automated backups set up
- [ ] Test backup completed
- [ ] Test restore completed

**Waiting for:** Your Render database connection URL to configure backup scripts.

---

**Last Updated:** June 25, 2026  
**Database:** Render PostgreSQL  
**Project:** ClanPlug  
**Status:** Configuration pending
