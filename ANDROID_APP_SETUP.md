# ClanPlug Android App Setup Guide

## ✅ What's Been Done

1. **Capacitor Installed** - Native Android bridge configured
2. **Android Platform Added** - Android project created in `/web/android`
3. **WebView Configuration** - App will load your production site (https://www.clanplug.site)
4. **Package Scripts Added** - Build commands for Android app

## 📱 How It Works

Your Android app is a **WebView wrapper** around your production website. This means:
- ✅ No need to rebuild the app for web changes
- ✅ All features work exactly like the website
- ✅ Updates happen automatically when you update the website
- ✅ Users always get the latest version
- ✅ Single codebase for web and mobile

The app loads `https://www.clanplug.site` inside a native Android container with:
- Native splash screen
- Native app icon
- Full-screen experience (no browser chrome)
- Access to native device features (camera, push notifications, etc.)
- Available on Google Play Store

## 🚀 Building the Android App

### Prerequisites

You need to install **Android Studio**:
- Download: https://developer.android.com/studio
- Install with default settings
- Open Android Studio and let it download SDK components
- Java JDK is included with Android Studio

### Build Steps

#### Step 1: Open Android Project
```bash
cd web
npm run cap:open:android
```

This opens the `web/android` folder in Android Studio.

#### Step 2: Wait for Gradle Sync
- Android Studio will sync Gradle dependencies automatically
- Wait for "Gradle build finished" message (bottom right)
- This takes 2-5 minutes on first run

#### Step 3: Build APK/AAB

**For Testing (APK):**
1. In Android Studio menu: Build > Build Bundle(s) / APK(s) > Build APK(s)
2. Wait for build to complete
3. Click "locate" to find your APK file
4. Install on your phone to test

**For Play Store (AAB):**
1. In Android Studio menu: Build > Generate Signed Bundle / APK
2. Choose "Android App Bundle"
3. Create/select keystore (see Keystore section below)
4. Select "release" build type
5. Wait for build
6. Upload the AAB file to Play Console

### Creating a Keystore (Required for Play Store)

```bash
# Run this command once
keytool -genkey -v -keystore clanplug-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias clanplug
```

You'll be asked for:
- Keystore password (choose a strong password)
- Your name and organization details
- Key password (can be same as keystore password)

**IMPORTANT**: 
- Keep the `.jks` file safe - you can't update your app without it
- Remember the passwords - write them down securely
- Never commit the keystore to Git

## 🎨 App Icons & Splash Screen

### Current Status
- Default Capacitor icons are being used
- Need to add custom ClanPlug branding

### To Add Custom Icons

1. **Prepare Icon** (1024x1024 PNG with transparent background)
2. **Use Android Studio's Asset Studio**:
   - Right-click `android/app/src/main/res`
   - New > Image Asset
   - Follow wizard to generate all icon sizes

3. **Splash Screen**:
   - Add to `android/app/src/main/res/drawable/splash.png`
   - Configure in `capacitor.config.ts`

## 🔧 Configuration Files

### capacitor.config.ts
```typescript
{
  appId: 'com.clanplug.app',
  appName: 'ClanPlug',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
}
```

### next.config.ts
- Added `output: 'export'` for static generation
- API calls will use NEXT_PUBLIC_API_URL from environment

## 🔌 Native Features Available

With Capacitor, you can add:
- Push notifications: `@capacitor/push-notifications`
- Camera: `@capacitor/camera`
- File system: `@capacitor/filesystem`
- Geolocation: `@capacitor/geolocation`
- Share: `@capacitor/share`
- Status bar: `@capacitor/status-bar`

Install with: `npm install @capacitor/[plugin-name]`

## ⚠️ Important Notes

### Static Export Limitations

Since we're using `output: 'export'`, some Next.js features are disabled:
- ❌ API Routes (use backend API instead)
- ❌ Server-side rendering
- ❌ Incremental Static Regeneration
- ✅ Client-side routing works
- ✅ All client components work
- ✅ Environment variables work

### API Configuration

The app uses `NEXT_PUBLIC_API_URL` to connect to your backend:
- Production: `https://api.clanplug.site`
- Development: Your local backend

Make sure this is set correctly in `.env.vercel` or `.env.production`.

## 🚀 Quick Commands

```bash
# Full build and open Android Studio
npm run build:android

# Just sync files (after changing web code)
npm run cap:sync

# Open Android Studio
npm run cap:open:android

# Regular web build
npm run build
```

## 📋 Play Store Checklist

Before submitting to Google Play:

- [ ] App icons added (all sizes)
- [ ] Splash screen added
- [ ] Screenshots taken (phone + tablet)
- [ ] Privacy policy URL ready
- [ ] Terms of service ready
- [ ] App description written
- [ ] Feature graphic created (1024x500)
- [ ] APK/AAB signed with release key
- [ ] Tested on multiple devices
- [ ] Version code incremented
- [ ] Permissions justified in manifest

## 🐛 Troubleshooting

### Build Fails
- Make sure Android Studio SDK is fully installed
- Check Java version: `java -version` (should be 17+)
- Clean build: Delete `android/build` and `android/app/build` folders

### App Crashes on Launch
- Check API URL is correct in environment variables
- Look at Android Studio Logcat for errors
- Ensure all API endpoints use HTTPS

### White Screen
- Build failed - check `out` folder exists
- Run `npm run cap:sync` after building
- Check browser console in Android Studio Device Manager

## 📞 Next Steps

1. **Build and Test**: Run `npm run build:android` and test in Android Studio emulator
2. **Add Icons**: Create custom app icons with ClanPlug branding
3. **Test on Device**: Install on real Android phone and test all features
4. **Create Keystore**: Generate release signing key for Play Store
5. **Submit to Play Store**: Create Play Console account and upload AAB

---

**Note**: Keep your signing keystore file safe! If you lose it, you can't update your app on Play Store.
