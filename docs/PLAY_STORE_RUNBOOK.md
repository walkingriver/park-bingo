# Play Store Deployment Runbook

This document describes the complete process for deploying Park Pursuit Bingo to the Google Play Store.

## Prerequisites

### Accounts Required
- **Google Play Developer Account** ($25 one-time fee)
- **GitHub Account** (for hosting privacy policy via GitHub Pages)

### Local Development Requirements
- **Java 21** - Required for Capacitor 7.x
  ```bash
  brew install openjdk@21
  ```
- **Android Studio** - For debugging and emulator
- **Node.js** and npm

## Project Configuration

### Package Name
```
com.walkingriver.parkbingo
```

This must match exactly in:
- `android/app/build.gradle` (applicationId)
- `capacitor.config.ts` (appId)
- Play Console app registration

### Keystore
Location: `android/park-pursuit-bingo.keystore`

Configuration in `android/keystore.properties`:
```properties
storePassword=parkpursuit2024
keyPassword=parkpursuit2024
keyAlias=park-pursuit-bingo
storeFile=../park-pursuit-bingo.keystore
```

**IMPORTANT:** The keystore file and `keystore.properties` are gitignored. Never commit these files.

### Java Configuration
Gradle is configured to use Java 21 in `android/gradle.properties`:
```properties
org.gradle.java.home=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
```

## Building a Release

### 1. Build the Web App and Sync to Android
```bash
npm run android:bundle
```

This runs:
1. `ng build` - Builds the Angular app
2. `npx cap sync android` - Syncs web assets to Android
3. `./gradlew bundleRelease` - Builds the signed AAB

### 2. Verify the AAB
Output location:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Verify signature:
```bash
jarsigner -verify -verbose android/app/build/outputs/bundle/release/app-release.aab
```

## Version Management

### Updating Version Numbers
Edit `android/app/build.gradle`:
```groovy
defaultConfig {
    versionCode 2        // Increment for each Play Store upload
    versionName "1.0.1"  // User-visible version
}
```

**Rules:**
- `versionCode` must increase with every Play Store upload
- `versionName` is what users see (can follow semver)

## Play Console Setup (First Time)

### 1. Create App
1. Go to [Play Console](https://play.google.com/console)
2. Click "Create app"
3. Enter app name: "Park Pursuit Bingo"
4. Select: App (not Game)
5. Select: Free
6. Confirm declarations

### 2. Store Listing
Required assets:
| Asset | Specification |
|-------|---------------|
| App icon | 512x512 PNG |
| Feature graphic | 1024x500 PNG |
| Phone screenshots | 2-8 images, 16:9 or 9:16 |
| Short description | Max 80 characters |
| Full description | Max 4000 characters |

### 3. Content Declarations

#### Data Safety Form
For this app, select:
- **Does your app collect or share user data?** No
- **Does your app handle data related to finances or payment?** No

#### Content Rating
Complete the IARC questionnaire:
- No violence
- No mature content
- No user-generated content
- No personal info collection

#### Target Audience
- Select age groups (all ages appropriate for this app)
- Confirm no appeal specifically to children under 13

### 4. Privacy Policy
URL: `https://walkingriver.com/park-bingo/privacy.html`

This is hosted via GitHub Pages from the `docs/` folder in the repository.

## Uploading to Play Store

### Internal Testing Track (Recommended for First Upload)

1. Go to **Release > Internal testing**
2. Click **Create new release**
3. Upload `app-release.aab`
4. Add release notes
5. Click **Review release**
6. Click **Start rollout to Internal testing**

Internal testing is instant - no review required.

### Adding Testers
1. Go to **Internal testing > Testers**
2. Create an email list
3. Add tester email addresses
4. Share the opt-in link with testers

## Production Release

After testing on internal track:

1. Go to **Release > Production**
2. Create new release
3. Copy AAB from internal testing (or upload new one)
4. Add release notes
5. Submit for review

Review typically takes 1-7 days for new apps.

## Troubleshooting

### Build Fails with "invalid source release: 21"
Java 21 is not being used. Verify:
```bash
# Check gradle.properties has correct Java path
grep "org.gradle.java.home" android/gradle.properties

# Verify Java 21 is installed
/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -version
```

### Build Fails with "Keystore not found"
Ensure `keystore.properties` exists and has correct relative path:
```properties
storeFile=../park-pursuit-bingo.keystore
```

### Version Code Error
Play Store requires increasing version codes. Check current version:
```bash
grep "versionCode" android/app/build.gradle
```

## File Locations Summary

| File | Purpose |
|------|---------|
| `android/app/build.gradle` | Version numbers, signing config |
| `android/gradle.properties` | Java home, memory settings |
| `android/keystore.properties` | Keystore credentials (gitignored) |
| `android/park-pursuit-bingo.keystore` | Signing key (gitignored) |
| `capacitor.config.ts` | Capacitor/app configuration |
| `docs/privacy.html` | Privacy policy (GitHub Pages) |
| `docs/terms.html` | Terms of service (GitHub Pages) |

## Quick Reference Commands

```bash
# Build release AAB
npm run android:bundle

# Open in Android Studio
npm run android:open

# Sync web changes to Android
npm run android:sync

# Check keystore contents
keytool -list -keystore android/park-pursuit-bingo.keystore

# Verify AAB signature
jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab
```

## Links

- [Play Console](https://play.google.com/console)
- [Privacy Policy](https://walkingriver.com/park-bingo/privacy.html)
- [Terms of Service](https://walkingriver.com/park-bingo/terms.html)
- [Marketing Site](https://walkingriver.com/park-bingo/)
