# 🚀 Deploy ClanPlug to Google Play - START HERE

## ✅ What's Ready

Your Android app is **100% ready to build**! The app will load your production website (https://www.clanplug.site) in a native container.

## 📱 Three Simple Steps

### STEP 1: Build the App (5 minutes)

Open PowerShell in the `web` folder and run:

```powershell
npm run cap:open:android
```

This opens Android Studio with your app ready to build.

### STEP 2: Build APK for Testing

In Android Studio:
1. Wait for "Gradle build finished" (bottom right) - takes 2-5 minutes first time
2. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to complete
4. Click **"locate"** to find your APK
5. Transfer to phone and test!

**APK Location:** `web/android/app/build/outputs/apk/debug/app-debug.apk`

### STEP 3: Build for Play Store

When ready to publish:

1. **Create Release Keystore** (ONE TIME ONLY):
```powershell
cd web
keytool -genkey -v -keystore clanplug-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias clanplug
```

⚠️ **SAVE THE PASSWORD!** You'll need it forever.

2. **Build Signed AAB** in Android Studio:
   - Menu: **Build → Generate Signed Bundle / APK**
   - Choose **"Android App Bundle"**
   - Select your keystore file
   - Choose **"release"** build type
   - Wait for build

3. **Upload to Play Console:**
   - Go to https://play.google.com/console
   - Create new app
   - Upload the AAB file
   - Fill in store listing
   - Submit for review (takes 3-7 days)

## 📋 What You Need for Play Store

### Required Info

**App Name:** ClanPlug

**Package:** com.clanplug.app

**Category:** Social

**Description:**
"ClanPlug is Nigeria's premier social marketplace designed for gamers, digital sellers, and service providers. Connect with your community, buy and sell gaming items, virtual goods, and services—all in one platform."

### Required Files

1. **App Icon** - 512x512 PNG ✅ (needs custom icon)
2. **Screenshots** - At least 2 phone screenshots ⏳ (take from running app)
3. **Feature Graphic** - 1024x500 PNG ⏳ (create banner image)
4. **Privacy Policy** - URL ✅ (https://www.clanplug.site/privacy)

### Required Accounts

1. **Google Play Console** - $25 one-time fee
   - Sign up: https://play.google.com/console
   
2. **Developer Account** - Use your Google account

## 🎯 Quick Start (Right Now!)

```powershell
# 1. Open Android Studio with your app
cd web
npm run cap:open:android

# 2. Wait for Gradle to finish
# 3. Build → Build APK
# 4. Test on your phone!
```

## ⚡ Key Facts

- **Your app loads the website** - No need to rebuild for web updates
- **All features work** - Everything from the website works in the app
- **Instant updates** - Update website = app updates automatically
- **One codebase** - Same code for web and mobile

## 🔧 If Android Studio Not Installed

1. Download: https://developer.android.com/studio
2. Install with ALL defaults
3. Open Android Studio
4. Let it download SDK components
5. Then run `npm run cap:open:android`

## 📞 Next Actions

**TODAY:**
1. ✅ Build APK and test on your phone
2. ⏳ Take 2-4 screenshots of the app
3. ⏳ Create app icon (512x512 PNG)

**THIS WEEK:**
1. Create Google Play Console account ($25)
2. Create release keystore
3. Build signed AAB
4. Fill in Play Store listing
5. Upload and submit for review

## 🐛 Common Issues

**"Android Studio won't open"**
→ Make sure Android Studio is installed

**"Gradle sync failed"**
→ Wait for it to finish, then File → Invalidate Caches → Restart

**"Build failed"**
→ Check Android Studio has finished downloading SDKs (bottom right)

**"App won't install on phone"**
→ Enable "Unknown sources" in phone settings

## 📖 Detailed Guide

For more details, see `BUILD_ANDROID_APP.md` in this folder.

---

**Ready to build?** Run this command now:

```powershell
cd web
npm run cap:open:android
```

Then follow the Android Studio steps above! 🚀
