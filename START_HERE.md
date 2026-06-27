# 🚀 ClanPlug Migration - START HERE

Your VPS is ready! Follow these steps to migrate everything to Contabo.

---

## 📋 Your VPS Details

```
IP Address: 176.57.189.248
Current Root Password: wK6Pf7D2i5pH (we'll change this immediately)
Location: Germany
Specs: 4 CPU, 8GB RAM, 150GB SSD
```

---

## ⚡ Quick Start (3 Steps)

### Step 1: Connect to VPS (2 minutes)

**Windows (Using PuTTY):**

1. **Download PuTTY:**
   - Go to: https://www.putty.org/
   - Download and install

2. **Connect:**
   - Open PuTTY
   - Host Name: `176.57.189.248`
   - Port: `22`
   - Click "Open"
   - Login as: `root`
   - Password: `wK6Pf7D2i5pH`

**Windows (Using Command Prompt/PowerShell):**
```powershell
ssh root@176.57.189.248
# Enter password: wK6Pf7D2i5pH
```

**First time connecting?**
- You'll see "authenticity of host can't be established"
- Type: `yes` and press Enter

---

### Step 2: Change Root Password (IMPORTANT!)

Once connected, run:
```bash
passwd
# Enter new password (twice)
# Use something strong like: ClanPlug2024!@#SecureRoot
```

**✅ Password changed! Save it securely.**

---

### Step 3: Run Setup Script

**On your LOCAL computer (Windows), upload the setup script:**

```powershell
# Navigate to your project folder
cd "C:\Users\1040 G7\Documents\Lordmoon"

# Upload setup script to VPS
scp contabo-setup.sh root@176.57.189.248:/root/
# Enter password when prompted
```

**On the VPS (PuTTY/SSH), run:**
```bash
cd /root
chmod +x contabo-setup.sh
bash contabo-setup.sh
```

**This will install:**
- ✅ Node.js 20
- ✅ PostgreSQL 15
- ✅ Redis
- ✅ Nginx
- ✅ PM2
- ✅ SSL (Certbot)
- ✅ Firewall

**Time:** 15-20 minutes

**⚠️ Don't close the terminal while it's running!**

---

## 📦 What Happens Next

After setup completes, you'll see:
```
✅ VPS Setup Complete!
```

Then we'll:
1. Backup your current database (5 min)
2. Upload your code to VPS (10 min)
3. Deploy applications (15 min)
4. Configure domain & SSL (10 min)
5. Test everything (15 min)

**Total time:** 2-3 hours

---

## 🌐 Update DNS Records

**While the setup runs, update your DNS:**

**Go to your domain registrar:**
- Namecheap: https://www.namecheap.com
- GoDaddy: https://www.godaddy.com
- Or wherever you bought clanplug.site

**Add these DNS records:**

```
Type    Host    Value               TTL
A       @       176.57.189.248      300
A       www     176.57.189.248      300
A       api     176.57.189.248      300
```

**Delete any old records** pointing to Vercel or Render.

**DNS takes 5-30 minutes to update.**

---

## 📁 File Structure on VPS

After migration, your VPS will have:

```
/var/www/clanplug/
├── backend/           # Node.js API
├── frontend/          # Next.js app
├── uploads/           # All media files
│   ├── images/        # Post images
│   ├── videos/        # Post videos
│   ├── avatars/       # Profile pictures
│   └── marketplace/   # Product images
├── backups/           # Database backups
└── logs/              # Application logs
```

---

## 🔒 Security Checklist

After setup:
- [x] Firewall enabled (only SSH, HTTP, HTTPS)
- [x] Root password changed
- [ ] SSH key authentication (optional, recommended)
- [ ] fail2ban configured (blocks brute force attacks)
- [ ] SSL certificates installed
- [ ] Database password secured

---

## 📊 Monitoring Commands

**Check if services are running:**
```bash
# Application status
pm2 status

# View logs
pm2 logs

# System resources
htop

# Disk usage
df -h

# Database status
systemctl status postgresql

# Web server status
systemctl status nginx
```

---

## 🆘 Troubleshooting

### Can't connect via SSH?
```bash
# Try with verbose output
ssh -v root@176.57.189.248

# Check if port 22 is open
telnet 176.57.189.248 22
```

### Setup script fails?
```bash
# Check internet connection
ping google.com

# Update system first
apt update
apt upgrade -y

# Try again
bash contabo-setup.sh
```

### Forgot new root password?
- Contact Contabo support
- They can reset it via their dashboard
- Have your customer ID ready

---

## 📞 Need Help?

**Common Issues:**

1. **"Permission denied"**
   - Make sure you're using `root` as username
   - Check password is correct

2. **"Connection refused"**
   - VPS might still be booting (wait 5 minutes)
   - Check IP address is correct: 176.57.189.248

3. **"Host key verification failed"**
   - Type: `ssh-keygen -R 176.57.189.248`
   - Try connecting again

---

## ✅ Ready to Start?

1. Connect to VPS
2. Change root password
3. Run setup script
4. Update DNS
5. Come back for next steps!

**Let me know once the setup script completes!**

---

## 🎯 Next Steps After Setup

Once `contabo-setup.sh` finishes:

1. **Backup current database**
   - Run: `node backup-render.js`

2. **Upload your code**
   - I'll guide you through this

3. **Deploy applications**
   - Run: `bash deploy-to-contabo.sh`

4. **Configure Nginx**
   - Run: `bash setup-nginx.sh`

5. **Setup SSL**
   - Run: `bash setup-ssl.sh`

6. **Test everything**
   - Visit: https://www.clanplug.site

**Current Status:** 🟡 Waiting for VPS setup

---

**Questions? Stuck? Let me know and I'll help!**
