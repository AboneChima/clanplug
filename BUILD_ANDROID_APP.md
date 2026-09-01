# 🚀 Build ClanPlug Android App - Complete Guide

## Current Setup Status

✅ Capacitor installed and configured
✅ Android project created
✅ App loads production site (https://www.clanplug.site)
✅ All features work (it's a WebView wrapper)

## 📋 Prerequisites

### 1. Install Android Studio
- Download: https://developer.android.com/studio
- Install with **ALL default components**
- First launch will download SDK (wait for completion)
- Java JDK is included

### 2. Check Your Developer Accounts

**Google Play Console:**
- URL: https://play.google.com/console
- One-time fee: $25
- Registration takes 1-2 days for approval

## 🔨 Build Commands

### Quick Build (Open Android Studio)
```powershell
cd web
npm run build:android
```

This will:
1. Build the Next.js app
2. Sync files to Android project
3. Open Android Studio automatically

### Manual Steps
```powershell
# 1. Build web app
cd web
npm run build

# 2. Sync to Android
npm run cap:sync

# 3. Open in Android Studio
npm run cap:open:android
```

## 📱 Building in Android Studio

### First Time Setup (5-10 minutes)

1. **Android Studio opens** → Wait for "Gradle Sync" to finish
2. **SDK Downloads** → May prompt to download missing SDKs (click OK)
3. **Gradle Build** → Bottom right shows "Build finished" when ready

### Build APK for Testing

1. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait 2-5 minutes for build
3. Click **"locate"** link when done
4. Transfer APK to your phone and install

APK Location: `web/android/app/build/outputs/apk/debug/app-debug.apk`

### Build AAB for Play Store (PRODUCTION)

1. Menu: **Build → Generate Signed Bundle / APK**
2. Choose **"Android App Bundle"**
3. Create/Select Keystore (see below)
4. Select **"release"** build variant
5. Wait for build
6. Upload to Play Console

AAB Location: `web/android/app/release/app-release.aab`

## 🔐 Creating Release Keystore (ONE TIME ONLY)

⚠️ **CRITICAL**: You need this to publish updates! Keep it safe!

```powershell
# Run this ONCE in web folder
cd web
keytool -genkey -v -keystore clanplug-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias clanplug
```

**You'll be asked:**
- Keystore password: (create a strong password)
- Re-enter password
- First and last name: ClanPlug
- Organization: ClanPlug
- City/State/Country: (your details)
- Correct? yes
- Key password: (press Enter to use same as keystore)

**Save this info securely:**
```
Keystore file: clanplug-release.jks
Keystore password: [YOUR_PASSWORD]
Key alias: clanplug
Key password: [YOUR_PASSWORD]
```

⚠️ **NEVER LOSE THIS FILE OR PASSWORD** - You can't update the app without it!

## 🎨 App Info (For Play Console)

**App Name:** ClanPlug

**Package Name:** com.clanplug.app

**Short Description (80 chars):**
"Social marketplace connecting gamers, sellers & service providers in Nigeria"

**Full Description:**
ClanPlug is Nigeria's premier social marketplace designed for gamers, digital sellers, and service providers. Connect with your community, buy and sell gaming items, virtual goods, and services—all in one platform.

KEY FEATURES:
• Social Feed - Share posts, videos, and connect with friends
• Group Chats - Join gaming communities and interest groups
• Marketplace - Buy/sell digital goods, game items, and services
• Secure Wallet - Manage funds with escrow protection
• VTU Services - Buy airtime, data, and digital services
• KYC Verification - Verified seller badges for trust
• Real-time Chat - Direct messaging and group conversations
• Push Notifications - Stay updated on messages and sales

Perfect for gamers, content creators, digital entrepreneurs, and anyone looking to connect and transact securely online.

**Category:** Social

**Content Rating:** Teen (PEGI 12+)

**Privacy Policy URL:** https://www.clanplug.site/privacy

**Support Email:** support@clanplug.site

## 📸 Required Assets

### 1. App Icon (REQUIRED)
- Size: 512x512 PNG
- Transparent background
- Location to add: `web/android/app/src/main/res/`
  - Use Android Studio: Right-click `res` → New → Image Asset

### 2. Feature Graphic (REQUIRED)
- Size: 1024x500 PNG
- For Play Store listing

### 3. Screenshots (REQUIRED - Minimum 2)
- Phone: 1080x1920 or similar
- Tablet: 1200x1920 or similar
- Take from running app

### 4. Promo Video (OPTIONAL)
- YouTube URL
- 30 seconds to 2 minutes

## 🔧 App Configuration

### Current Config (`capacitor.config.ts`)
```typescript
{
  appId: 'com.clanplug.app',
  appName: 'ClanPlug',
  webDir: 'out',
  server: {
    url: 'https://www.clanplug.site',
    androidScheme: 'https',
    cleartext: false,
  },
}
```

**This means:**
- App loads your production website
- No need to rebuild app for web updates
- All features work exactly like website
- Users always get latest version

### App Version
Update in `web/android/app/build.gradle`:
```gradle
versionCode 1      // Increment for each release (2, 3, 4...)
versionName "1.0.0" // User-facing version
```

## 🚀 Publishing to Play Store

### Step 1: Prepare Release

1. **Update version numbers** in `build.gradle`
2. **Build signed AAB** (with release keystore)
3. **Test thoroughly** on multiple devices

### Step 2: Create Play Console App

1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in app details
4. Complete **Store Listing**:
   - Upload screenshots
   - Add descriptions
   - Upload app icon
   - Add feature graphic

### Step 3: Complete Requirements

**App Content:**
- Privacy policy URL
- Ads declaration (No ads)
- Content rating questionnaire
- Target audience (Teen)
- News app declaration (No)

**Data Safety:**
- Declare what data you collect
- Privacy practices

### Step 4: Upload AAB

1. **Production → Create new release**
2. **Upload AAB file**
3. **Release notes** (what's new)
4. **Save & Review**
5. **Roll out to Production**

### Step 5: Wait for Review

- First review: 3-7 days
- Updates: 1-3 days
- You'll get email when approved

## 🐛 Troubleshooting

### Build Fails in Android Studio

**Problem:** "SDK not found"
**Solution:** Tools → SDK Manager → Install missing components

**Problem:** "Gradle sync failed"
**Solution:** File → Invalidate Caches → Restart

**Problem:** Java version error
**Solution:** File → Project Structure → JDK → Use Android Studio JDK

### App Crashes on Launch

**Problem:** White screen
**Solution:** 
1. Check `out` folder exists after build
2. Run `npm run cap:sync`
3. Clean build in Android Studio

**Problem:** Can't connect to API
**Solution:** Check backend is accessible at https://api.clanplug.site

### Play Store Rejection

**Common reasons:**
- Missing privacy policy
- Content rating incomplete
- Screenshots low quality
- App crashes during review

## ✅ Pre-Launch Checklist

- [ ] Android Studio installed
- [ ] App builds successfully
- [ ] APK tested on real device
- [ ] All features working
- [ ] Release keystore created and backed up
- [ ] App icons added (512x512)
- [ ] Screenshots taken (2+)
- [ ] Feature graphic created (1024x500)
- [ ] Privacy policy URL ready
- [ ] Play Console account created ($25 paid)
- [ ] Descriptions written
- [ ] Version numbers set

## 📞 Quick Commands Reference

```powershell
# Full build flow
cd web
npm run build:android

# Just sync after web changes
npm run cap:sync

# Open Android Studio
npm run cap:open:android

# Build web only
npm run build
```

## 🎯 Next Steps

1. **Build APK** → Test on your phone
2. **Add app icons** → Replace default Capacitor icon
3. **Take screenshots** → 2-4 good quality images
4. **Create keystore** → For signing releases
5. **Build AAB** → Signed release bundle
6. **Create Play listing** → Fill in all info
7. **Upload AAB** → Submit for review
8. **Wait for approval** → Usually 3-7 days

---

**Need Help?**
- Android Studio docs: https://developer.android.com/studio/intro
- Play Console help: https://support.google.com/googleplay/android-developer
- Capacitor docs: https://capacitorjs.com/docs/android

**Remember:**
- The app is just a wrapper around your website
- Update your website = app updates automatically
- Only rebuild/reupload if changing native features
- Keep your release keystore SAFE!
