# Park Bingo - App Store Build Instructions

This document provides step-by-step instructions for building and submitting Park Bingo to the Google Play Store and Apple App Store.

## Prerequisites

### Common Requirements
- Node.js 18+ and npm installed
- The app successfully builds with `npm run build`
- Capacitor platforms added and synced

### Android Requirements
- Android Studio installed (latest stable version)
- Java Development Kit (JDK) 17+
- Android SDK 34 (Android 14)
- A Google Play Developer account ($25 one-time fee)
- A signing key for release builds

### iOS Requirements
- macOS with Xcode 15+ installed
- An Apple Developer account ($99/year)
- Valid signing certificates and provisioning profiles
- CocoaPods installed (`sudo gem install cocoapods`)

---

## Android Build (Google Play Store)

### Step 1: Generate a Signing Key (First Time Only)

```bash
keytool -genkey -v -keystore park-bingo-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias park-bingo
```

Store this key securely - you'll need it for all future updates!

### Step 2: Configure Signing in Android Studio

1. Open Android Studio
2. Open the `android` folder from this project
3. Go to **Build > Generate Signed Bundle / APK**
4. Select **Android App Bundle**
5. Enter your keystore path, passwords, and alias
6. Select **release** build variant
7. Click **Finish**

### Step 3: Build the Release Bundle

Alternatively, use the command line:

```bash
# Navigate to android folder
cd android

# Build release AAB (requires signing configured in gradle)
./gradlew bundleRelease
```

The signed AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing
3. Go to **Release > Production > Create new release**
4. Upload the `.aab` file
5. Fill in release notes
6. Submit for review

### Step 5: Complete Store Listing

Use the content from `store-assets/google-play-listing.md`:
- App name and descriptions
- Screenshots (6-8 phone screenshots)
- Feature graphic (1024x500)
- Privacy policy URL
- Content rating questionnaire

---

## iOS Build (Apple App Store)

### Step 1: Open in Xcode

```bash
npx cap open ios
```

Or open `ios/App/App.xcworkspace` directly in Xcode.

### Step 2: Configure Signing

1. Select the **App** target in the project navigator
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (Apple Developer account)
4. Ensure **Bundle Identifier** is `com.walkingriver.parkbingo`
5. Xcode will automatically manage signing

### Step 3: Build Settings

1. Set **Deployment Target** to iOS 16.0 or higher
2. Verify the **App Icons** are present in Assets.xcassets
3. Set **Build Configuration** to **Release**

### Step 4: Archive for Distribution

1. Select **Any iOS Device** as the build target (not a simulator)
2. Go to **Product > Archive**
3. Wait for the archive to complete
4. The Organizer window will open automatically

### Step 5: Upload to App Store Connect

1. In the Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Choose **Upload** to send to App Store Connect
5. Follow the wizard to complete the upload

### Step 6: Complete App Store Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app (or create a new one)
3. Fill in metadata using `store-assets/app-store-listing.md`:
   - App name, subtitle, description
   - Screenshots for required device sizes
   - Keywords
   - Privacy policy URL
4. Submit for review

---

## Pre-Submission Checklist

### Both Platforms
- [ ] App builds without errors
- [ ] All icons and splash screens generated
- [ ] Privacy policy URL is live
- [ ] Support URL/email is configured
- [ ] Store descriptions are complete
- [ ] Screenshots are prepared
- [ ] Age rating questionnaire completed

### Android Specific
- [ ] Signed AAB generated (not APK)
- [ ] Target SDK is 34+
- [ ] Content rating questionnaire completed
- [ ] Data safety section filled

### iOS Specific
- [ ] Bundle ID matches App Store Connect
- [ ] App icons are 1024x1024 (no alpha channel)
- [ ] All required screenshot sizes provided
- [ ] App Privacy details filled in App Store Connect

---

## Troubleshooting

### Android: Gradle build fails
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### iOS: Pod install fails
```bash
cd ios/App
pod deintegrate
pod install --repo-update
```

### iOS: Signing issues
- Ensure your Apple Developer account is active
- Check that the Bundle ID is registered in Apple Developer portal
- Regenerate provisioning profiles if expired

---

## Quick Commands

```bash
# Rebuild and sync everything
npm run build && npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios

# Run on Android device/emulator
npx cap run android

# Run on iOS simulator
npx cap run ios
```
