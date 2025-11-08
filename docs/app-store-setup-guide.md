# Hot Takes - App Store Setup Guide

This guide walks you through setting up **Hot Takes** (`com.jbuxofplenty.hottakes`) on both App Store Connect (iOS) and Google Play Console (Android).

## Quick Start

Run the automated setup script:

```bash
./scripts/setup-app-stores.sh
```

This script will guide you through the entire process. If you prefer manual setup, follow the detailed steps below.

---

## Prerequisites

### Required Tools

- ✅ Xcode (for iOS development)
- ✅ Android Studio (for Android development)
- ✅ Fastlane (via `bundle install`)
- ✅ GitHub CLI (`gh`) - optional but recommended
- ✅ Java JDK 17+ (for Android keystore generation)

### Required Accounts

- ✅ Apple Developer Account ($99/year)
- ✅ Google Play Developer Account ($25 one-time)
- ✅ Firebase Account (free)

### Configuration Files

- ✅ `.env.fastlane` - with all your credentials
- ✅ `.env.preview` and `.env.production` - app environment variables
- ✅ `google-services.json` - Firebase Android config
- ✅ `GoogleService-Info.plist` - Firebase iOS config

---

## Part 1: iOS Setup (App Store Connect)

### Step 1: Create App in App Store Connect

#### Option A: Using Fastlane (Recommended - Automated)

```bash
# Load your credentials
source .env.fastlane

# Create the app
bundle exec fastlane produce \
  --app_identifier "com.jbuxofplenty.hottakes" \
  --app_name "Hot Takes" \
  --language "en-US" \
  --sku "hottakes" \
  --team_id "$IOS_TEAM_ID" \
  --api_key_path "$APP_STORE_CONNECT_API_KEY_PATH"
```

#### Option B: Manual Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Apps** → **+** (Add App)
3. Fill in details:
   - **Platform**: iOS
   - **Name**: Hot Takes
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select or create `com.jbuxofplenty.hottakes`
   - **SKU**: `hottakes`
   - **User Access**: Full Access

### Step 2: Configure App Metadata

1. Navigate to your app in App Store Connect
2. Go to **App Information**:

   - **Category**: Games → Social (or appropriate category)
   - **Age Rating**: Complete questionnaire based on app content
   - **Content Rights**: Yes (you own the rights)

3. Go to **Prepare for Submission**:

   - Add app description (see PRD for details)
   - Add keywords: `hot takes, opinion, game, social, debate`
   - Add screenshots (minimum requirements):
     - iPhone 6.7": 2-10 screenshots
     - iPhone 6.5": 2-10 screenshots (can reuse 6.7")
   - Add app icon (1024x1024)
   - Set support URL and marketing URL

4. **App Privacy**:
   - Complete privacy questionnaire
   - Add privacy policy URL
   - Since app collects payment info (Venmo/PayPal), declare data collection

### Step 3: Setup Code Signing with Fastlane Match

Match stores your certificates and provisioning profiles in a private git repo.

#### First Time Setup:

```bash
# Create a private GitHub repo: github.com/jbuxofplenty/hottakes-certificates
# Then initialize Match

source .env.fastlane

# Development certificates (for testing)
MATCH_GIT_URL=git@github.com:jbuxofplenty/fastlane_match.git \
  bundle exec fastlane match development \
  --app_identifier "com.jbuxofplenty.hottakes"

# App Store certificates (for distribution)
MATCH_GIT_URL=git@github.com:jbuxofplenty/fastlane_match.git \
  bundle exec fastlane match appstore \
  --app_identifier "com.jbuxofplenty.hottakes"
```

#### If Match is Already Setup:

```bash
# Just sync certificates
bundle exec fastlane match development --readonly
bundle exec fastlane match appstore --readonly
```

### Step 4: Enable Required Capabilities

In App Store Connect → **Features**:

- ✅ Enable **Sign in with Apple** (if using Apple auth)
- ✅ Enable **Push Notifications** (for engagement)
- ✅ Enable **Associated Domains** (for deep linking)

---

## Part 2: Android Setup (Google Play Console)

### Step 1: Create Android Signing Key

Generate a keystore for signing your Android app:

```bash
keytool -genkey -v \
  -keystore ./release.keystore \
  -alias hottakes \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Enter when prompted:**

- Keystore password: _(save this!)_
- Key password: _(save this!)_
- Name and organization details

**Important**: Update `.env.fastlane` with your passwords:

```bash
ANDROID_KEYSTORE_PATH=./release.keystore
ANDROID_KEYSTORE_PASSWORD=<your-keystore-password>
ANDROID_KEY_ALIAS=hottakes
ANDROID_KEY_PASSWORD=<your-key-password>
```

### Step 2: Create App in Google Play Console

⚠️ **This MUST be done manually** - Google doesn't provide CLI tools.

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in details:
   - **App name**: Hot Takes
   - **Default language**: English (United States)
   - **App or game**: Game
   - **Free or paid**: Free
4. Accept Developer Program Policies
5. Click **Create app**

### Step 3: Complete Initial Setup

#### Dashboard Setup Tasks:

1. **App access** → All functionality available without restrictions
2. **Ads** → Select "Yes, my app contains ads"
3. **Content rating** → Complete questionnaire
4. **Target audience** → Select appropriate age groups
5. **News app** → No
6. **COVID-19 contact tracing** → No
7. **Data safety** → Complete form (collects payment info, personal data)
8. **Government apps** → No
9. **Financial features** → Select appropriate options (handles payments)
10. **App category** → Games → Social
11. **Store listing** → Add:
    - App description (see PRD)
    - Screenshots (minimum 2)
    - Feature graphic (1024x500)
    - App icon (512x512)
12. **Privacy policy** → Add URL

### Step 4: Upload First Build (Manual)

The first Android build MUST be uploaded manually:

```bash
# Generate Android project
npx expo prebuild --platform android --clean

# Build the AAB (Android App Bundle)
cd android
./gradlew bundleRelease

# The AAB will be at:
# android/app/build/outputs/bundle/release/app-release.aab
```

**Upload to Play Console:**

1. Go to **Production** → **Create new release**
2. Upload `app-release.aab`
3. Add release notes
4. Save (don't submit for review yet)

### Step 5: Setup Internal Testing Track

1. Go to **Testing** → **Internal testing**
2. Create release → Upload same AAB
3. Add internal testers (your email)
4. This allows automated builds to go to internal testing first

### Step 6: Enable API Access

For automated builds via Fastlane:

1. Go to **Setup** → **API access**
2. Link to Google Cloud project (create if needed)
3. **Create service account**:
   - Go to Google Cloud Console
   - Create service account with name: `hottakes-deployer`
   - Download JSON key
   - Save as: `google-play-service-account.json`
4. Back in Play Console:
   - Invite service account
   - Grant **Release manager** permission
   - Grant **View app information** permission

---

## Part 3: GitHub Actions Configuration

### Set GitHub Variables

These are PUBLIC configuration values (not secrets):

```bash
# iOS Configuration
gh variable set IOS_APP_IDENTIFIER --body "com.jbuxofplenty.hottakes"
gh variable set IOS_TEAM_ID --body "YOUR_TEAM_ID"
gh variable set IOS_SCHEME --body "hottakes"
gh variable set IOS_WORKSPACE_PATH --body "./ios/hottakes.xcworkspace"
gh variable set IOS_PROJECT_PATH --body "./ios/hottakes.xcodeproj"
gh variable set IOS_OUTPUT_NAME --body "hottakes.ipa"

# Android Configuration
gh variable set ANDROID_PACKAGE_NAME --body "com.jbuxofplenty.hottakes"
gh variable set ANDROID_PROJECT_DIR --body "./android"

# Firebase Configuration
gh variable set FIREBASE_PROJECT_ID --body "your-firebase-project-id"
```

Or set manually at:
`https://github.com/YOUR_USERNAME/hot_takes/settings/variables/actions`

### Upload Secrets

Run the setup script to upload all secrets:

```bash
./scripts/setup-github-secrets.sh
```

This uploads:

- iOS certificates and credentials
- Android keystore and credentials
- Firebase configuration
- App environment variables

---

## Part 4: Testing the Setup

### Local Testing

```bash
# iOS
npx expo prebuild --platform ios --clean
cd ios && pod install
npx expo run:ios

# Android
npx expo prebuild --platform android --clean
npx expo run:android
```

### Test Local Fastlane Builds

```bash
# iOS
source .env.fastlane
bundle exec fastlane ios build

# Android
bundle exec fastlane android build
```

### Trigger CI/CD Build

```bash
# Create develop branch
git checkout -b develop
git push origin develop

# Or create a staging tag
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

Monitor build at: `https://github.com/YOUR_USERNAME/hot_takes/actions`

---

## Part 5: First Deployment

### Staging (TestFlight / Internal Testing)

#### Option A: Automatic (via CI/CD)

Push to `develop` branch or create a beta tag:

```bash
git checkout develop
git push origin develop
```

#### Option B: Manual

```bash
source .env.fastlane

# iOS → TestFlight
bundle exec fastlane ios beta

# Android → Internal Testing
bundle exec fastlane android beta
```

### Production (App Store / Play Store)

After testing on TestFlight/Internal Testing:

```bash
# Create production tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically build and submit to both stores.

**Important**: First production submission requires manual review of metadata and compliance in both store consoles.

---

## Troubleshooting

### iOS Issues

**Certificate mismatch:**

```bash
bundle exec fastlane match appstore --force_for_new_devices
```

**Build fails with provisioning error:**

- Check Team ID matches in Xcode and Fastlane
- Verify bundle identifier matches exactly
- Re-run `fastlane match appstore`

**TestFlight upload fails:**

- Verify App Store Connect API key is valid
- Check you're using correct issuer ID and key ID
- Ensure app is created in App Store Connect

### Android Issues

**Keystore password incorrect:**

- Double-check passwords in `.env.fastlane`
- Ensure no extra spaces in password values

**Service account permission denied:**

- Verify service account has "Release manager" role
- Check it's been accepted in Play Console
- Wait 5-10 minutes after granting permissions

**First build upload fails:**

- First build MUST be uploaded manually via Play Console
- Automated uploads only work after initial manual upload

### GitHub Actions Issues

**Secrets not loading:**

```bash
# Re-run setup script
./scripts/setup-github-secrets.sh

# Verify secrets exist
gh secret list
```

**Variables not set:**

```bash
gh variable list
```

---

## Maintenance

### Updating App Metadata

**iOS**: Update in App Store Connect web interface  
**Android**: Update in Play Console web interface

### Updating Secrets

```bash
# Update .env.fastlane with new values
vim .env.fastlane

# Re-upload to GitHub
./scripts/setup-github-secrets.sh
```

### Certificate Renewal

Certificates expire after 1 year. Fastlane Match handles renewal:

```bash
bundle exec fastlane match appstore --force
```

---

## Resources

- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Fastlane Documentation](https://docs.fastlane.tools)
- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Workflows](../.github/workflows/)

---

## Summary Checklist

- [ ] iOS app created in App Store Connect
- [ ] iOS metadata and privacy configured
- [ ] Fastlane Match setup complete
- [ ] Android keystore generated
- [ ] Android app created in Play Console
- [ ] Android first build uploaded manually
- [ ] Google Play API access enabled
- [ ] GitHub Variables configured
- [ ] GitHub Secrets uploaded
- [ ] Local builds tested
- [ ] CI/CD deployment tested
- [ ] TestFlight build received
- [ ] Internal testing build received

Once complete, you're ready to start deploying Hot Takes! 🌶️🔥
