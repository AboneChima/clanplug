# 🔔 PUSH NOTIFICATIONS - FINAL SETUP

## You need to run these commands on your VPS

### Option 1: Using PuTTY (Recommended)
1. Open PuTTY
2. Connect to: `176.57.189.248`
3. Login as: `root`
4. Password: `ClanPlugDB2024`
5. Copy and paste these commands ONE BY ONE:



Wait for it to finish, then:

```bash
grep -q "VAPID_PUBLIC_KEY" .env || echo -e "\n# Push Notifications - VAPID Keys\nVAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo\nVAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE\nVAPID_SUBJECT=mailto:support@clanplug.site" >> .env
```

Then rebuild:

```bash
npm run build
```

Finally restart:

```bash
pm2 restart clanplug-backend
pm2 status
```

### Option 2: All-in-One Command
Or just copy this single command:

```bash
cd /root/clanplug && npm install web-push && grep -q "VAPID_PUBLIC_KEY" .env || echo -e "\n# Push Notifications - VAPID Keys\nVAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo\nVAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE\nVAPID_SUBJECT=mailto:support@clanplug.site" >> .env && npm run build && pm2 restart clanplug-backend && pm2 status
```

## Test Push Notifications

After completing the setup:

1. Go to: **https://www.clanplug.site/settings**
2. Scroll to "Push Notifications" section
3. Click **"Enable"** button
4. Allow notifications when browser prompts
5. Click **"Test"** button
6. You should receive a push notification! 🎉

## Troubleshooting

If it doesn't work:
- Check PM2 logs: `pm2 logs clanplug-backend --lines 50`
- Make sure the backend restarted: `pm2 status`
- Check if web-push is installed: `cd /root/clanplug && npm list web-push`

## What This Does

1. **Installs web-push**: NPM package needed for push notifications
2. **Adds VAPID keys**: Security keys for push notification authentication
3. **Rebuilds backend**: Compiles the TypeScript code with new dependencies
4. **Restarts PM2**: Applies the changes to the running backend

✅ After this, push notifications will work perfectly!
