# GitHub Actions Setup Checklist for Hot Takes

This checklist ensures all project-specific configurations are properly set up in GitHub.

## ✅ Pre-Deployment Checklist

### 1. Repository Setup

- [ ] **Create develop branch**

  ```bash
  git checkout -b develop
  git push origin develop
  ```

  _Alternative:_ Update workflows to use `main` instead of `develop` if you prefer single-branch workflow

### 2. Configure Secret Files

Create and fill in these configuration files (templates provided):

**App Environment Variables:**

- [ ] Create `.env.preview` (staging environment variables - see `.env.example`)
- [ ] Create `.env.production` (production environment variables - see `.env.example`)

**GitHub Secrets Configuration:**

- [ ] Fill in `.env.github` with all CI/CD secrets (template already exists)
  - iOS/App Store Connect credentials
  - Android/Google Play credentials
  - Fastlane Match configuration
  - Firebase token

**Required Files:**

- [ ] Add `google-services.json` (Android Firebase config - download from Firebase Console)
- [ ] Add `GoogleService-Info.plist` (iOS Firebase config - download from Firebase Console)
- [ ] Add `AuthKey_*.p8` (App Store Connect API key - optional but recommended)
- [ ] Add `release.keystore` (Android signing keystore)
- [ ] Add `google-play-service-account.json` (Google Play service account key)

### 3. Upload All Secrets Automatically

Once all files are configured, run the automated setup script:

```bash
./scripts/setup-github-secrets.sh
```

This single script will upload **all** secrets to GitHub:

**App Environment Variables:**

- `STAGING_ENV_FILE`
- `PRODUCTION_ENV_FILE`

**iOS/App Store Connect:**

- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_CONTENT`
- `APPLE_ID`
- `MATCH_PASSWORD`
- `MATCH_GIT_BASIC_AUTHORIZATION`

**Android/Google Play:**

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

**Firebase:**

- `FIREBASE_TOKEN`

The script will:

- ✅ Validate all required files exist
- ✅ Automatically base64 encode keystores and certificates
- ✅ Properly format multi-line secrets (like .p8 files)
- ✅ Report any missing or unconfigured values
- ✅ Upload everything to GitHub in one command

### 4. GitHub Variables

Create these variables in GitHub (Settings → Secrets → Variables → Actions):

**iOS:**

- [ ] `IOS_APP_IDENTIFIER` (e.g., `com.yourcompany.hottakes`)
- [ ] `IOS_TEAM_ID` (Apple Developer Team ID)
- [ ] `IOS_SCHEME` (usually same as app name, e.g., `hottakes`)
- [ ] `IOS_WORKSPACE_PATH` (e.g., `./ios/hottakes.xcworkspace`)
- [ ] `IOS_PROJECT_PATH` (e.g., `./ios/hottakes.xcodeproj`)
- [ ] `IOS_OUTPUT_NAME` (e.g., `hottakes.ipa`)

**Android:**

- [ ] `ANDROID_PACKAGE_NAME` (e.g., `com.yourcompany.hottakes`)
- [ ] `ANDROID_PROJECT_DIR` (e.g., `./android`)

**Firebase:**

- [ ] `FIREBASE_PROJECT_ID` (your Firebase project ID)

### 5. GitHub Environments

Create these environments in GitHub (Settings → Environments):

- [ ] **staging** - For TestFlight/Internal Testing builds
  - Optional: Add protection rules
- [ ] **production** - For App Store/Play Store releases
  - Recommended: Add required reviewers
- [ ] **production-approval** - Manual approval gate before production
  - Required: Add required reviewers (at least 1)

### 6. Repository Settings

- [ ] Enable Actions: Settings → Actions → General → Allow all actions
- [ ] Set workflow permissions: Settings → Actions → General → Workflow permissions → "Read and write permissions"
- [ ] Enable tag/branch protection (optional but recommended)

## 🔍 Verify Setup

After setup, verify everything works:

1. **Test workflows:**

   ```bash
   # Push to main to trigger tests
   git push origin main

   # Or manually trigger test workflow
   gh workflow run test.yml
   ```

2. **Check secrets are set:**

   ```bash
   gh secret list
   gh variable list
   ```

3. **Verify environments:**
   - Go to Settings → Environments
   - Confirm all 3 environments exist

## 📝 Quick Reference: Environment Files Structure

Your `.env.preview` and `.env.production` should contain:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
# ... etc (see .env.example)
```

## 🚀 Deployment Workflow

Once setup is complete:

1. **Staging Deployment:**

   - Push to `develop` branch, or
   - Create tag like `v1.0.0-beta.1`, or
   - Manually trigger from Actions tab

2. **Production Deployment:**
   - Approve staging build in Actions tab, or
   - Create tag like `v1.0.0`, or
   - Manually trigger from Actions tab

## 🔗 Helpful Commands

```bash
# List all secrets
gh secret list

# List all variables
gh variable list

# View workflow runs
gh run list

# Trigger workflow manually
gh workflow run deploy-staging.yml

# View logs
gh run view <run-id> --log
```

## ⚠️ Important Notes

1. **Never commit** `.env.preview`, `.env.production`, `google-services.json`, `GoogleService-Info.plist`, or `.keystore` files
2. All these files are in `.gitignore` for safety
3. Update secrets by re-running `./scripts/setup-github-secrets.sh`
4. Fastlane Match repo should be private and separate from this repo
