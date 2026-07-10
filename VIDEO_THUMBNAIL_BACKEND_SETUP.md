# Video Thumbnail Backend Setup Instructions

## What This Fixes
- Video thumbnails will be generated server-side when videos are uploaded
- Thumbnails will work consistently on ALL devices (iOS, Android, Windows)
- No more browser compatibility issues

## Steps to Run on VPS (176.57.189.248)

### 1. SSH into your VPS
```bash
ssh root@176.57.189.248
cd /var/www/clanplug  # or wherever your backend code is
```

### 2. Install ffmpeg (if not already installed)
```bash
apt-get update
apt-get install -y ffmpeg

# Verify installation
ffmpeg -version
```

### 3. Pull latest backend code
```bash
git pull origin main
```

### 4. Run database migration
```bash
npx prisma migrate dev --name add-video-thumbnails
```

If it asks "Do you want to continue? All data will be lost." type **n** (no) and use this instead:
```bash
npx prisma migrate deploy
```

### 5. Generate Prisma client
```bash
npx prisma generate
```

### 6. Restart your backend server
```bash
# If using PM2:
pm2 restart all

# If using systemd:
systemctl restart clanplug

# Or kill and restart manually:
pkill node
npm start
```

### 7. Test it
Create a new post with a video - the API should now return a `videoThumbnails` array with thumbnail URLs!

## What Changed in the Code

1. **Database**: Added `videoThumbnails String[]` field to Post model
2. **Backend**: When a video post is created, ffmpeg extracts a frame at 0.5 seconds and saves it as a JPEG
3. **API Response**: Post objects now include `videoThumbnails: ["https://api.clanplug.site/uploads/videos/xxx_thumb.jpg"]`
4. **Frontend**: User profile pages now display the thumbnail images instead of trying to render video elements

## Troubleshooting

**If thumbnails don't generate:**
1. Check ffmpeg is installed: `ffmpeg -version`
2. Check backend logs for errors: `pm2 logs` or check your log file
3. Verify video files are accessible at `/var/www/clanplug/uploads/videos/`
4. Check file permissions: `chmod 755 /var/www/clanplug/uploads/videos/`

**If old videos don't have thumbnails:**
You can run a script to generate thumbnails for existing videos (optional - only new videos will auto-generate)
