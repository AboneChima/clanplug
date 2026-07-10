# User Data Export Instructions

## Method 1: Run on VPS (Recommended)

### Step 1: Upload the script
```bash
# From your local machine, upload the script to VPS
scp export-users-vps.js root@176.57.189.248:/var/www/clanplug/backend/
```

### Step 2: SSH into VPS
```bash
ssh root@176.57.189.248
```

### Step 3: Navigate to backend directory
```bash
cd /var/www/clanplug/backend
```

### Step 4: Run the export script
```bash
node export-users-vps.js
```

### Step 5: Download the exported files
The script will create an `exports` folder with:
- `users-export-YYYY-MM-DD.json` - JSON format
- `users-export-YYYY-MM-DD.csv` - CSV format (can open in Excel)

To download them to your local machine:
```bash
# Run this from your local machine (in a new terminal)
scp root@176.57.189.248:/var/www/clanplug/backend/exports/* ./
```

---

## Method 2: Direct Database Query (Alternative)

If you prefer to query the database directly:

```bash
# SSH into VPS
ssh root@176.57.189.248

# Connect to PostgreSQL
psql -U lordmoon -d clanplug

# Export to CSV
\copy (SELECT id, username, email, "firstName", "lastName", phone, city, state, country, "isKYCVerified", "isBanned", "createdAt" FROM "User" ORDER BY "createdAt" DESC) TO '/tmp/users-export.csv' WITH CSV HEADER;

# Exit psql
\q

# Download the file
# (Run from your local machine)
scp root@176.57.189.248:/tmp/users-export.csv ./
```

---

## What Data is Exported?

The export includes:
- ✅ Basic Info: ID, username, email, name, phone
- ✅ Location: City, state, country
- ✅ Profile: Bio, avatar URL
- ✅ Verification: KYC status, verification badge status
- ✅ Wallet: Balance, total deposits, withdrawals
- ✅ Engagement: Posts count, followers, following, messages
- ✅ Dates: Account creation, last login
- ✅ Status: Banned status

The export also includes:
- 📊 Summary statistics
- 🌟 Top users by followers
- 📝 Top users by posts
- 💰 Financial summary

---

## Security Note

⚠️ **The exported files contain sensitive user data including emails and phone numbers.**

- Store securely
- Don't commit to git
- Don't share publicly
- Delete after use if no longer needed

---

## Troubleshooting

### "Cannot connect to database"
Make sure you're running the script on the VPS where the database is located.

### "Permission denied"
```bash
chmod +x export-users-vps.js
```

### "prisma not found"
```bash
cd /var/www/clanplug/backend
npm install
```
