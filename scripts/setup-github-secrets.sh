#!/bin/bash

# Setup GitHub Secrets for Hot Takes
# This script uploads all required secrets to GitHub for CI/CD workflows

set -e

echo "🔐 Setting up GitHub Secrets for Hot Takes..."
echo ""

# ============================================
# Preflight Checks
# ============================================

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub CLI"
    echo "Run: gh auth login --scopes 'repo,workflow'"
    exit 1
fi

echo "✅ GitHub CLI is authenticated"
echo ""

# ============================================
# Load Environment Files
# ============================================

if [ ! -f ".env.fastlane" ]; then
    echo "❌ Error: .env.fastlane not found!"
    echo "Please create .env.fastlane with your Fastlane and CI/CD secrets"
    echo "See .env.fastlane for required variables"
    exit 1
fi

echo "📋 Loading secrets from .env.fastlane..."
source .env.fastlane

# Validate required variables are set (not default placeholders)
MISSING_VARS=()

check_var() {
    local var_name=$1
    local var_value="${!var_name}"
    if [ -z "$var_value" ] || [[ "$var_value" == *"your-"* ]] || [[ "$var_value" == *"YOUR_"* ]] || [[ "$var_value" == *"example.com"* ]]; then
        MISSING_VARS+=("$var_name")
    fi
}

echo ""

# ============================================
# Section 1: App Environment Variables
# ============================================

echo "========================================"
echo "1. App Environment Files"
echo "========================================"
echo ""

# Check if .env files exist
if [ ! -f ".env.preview" ]; then
    echo "❌ Error: .env.preview not found!"
    echo "Please create .env.preview with your Firebase credentials for staging"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production not found!"
    echo "Please create .env.production with your Firebase credentials for production"
    exit 1
fi

echo "📋 Found environment files:"
echo "  • .env.preview (staging)"
echo "  • .env.production (production)"
echo ""

# Upload staging .env file
echo "📤 Uploading .env.preview as STAGING_ENV_FILE..."
TEMP_ENV=$(mktemp)
grep -v '^\s*#' .env.preview | grep -v '^\s*$' > "$TEMP_ENV"
echo "   Filtered $(wc -l < "$TEMP_ENV" | tr -d ' ') lines (removed comments and empty lines)"
gh secret set STAGING_ENV_FILE < "$TEMP_ENV"
rm "$TEMP_ENV"
echo "✅ STAGING_ENV_FILE uploaded successfully"
staging_count=$(grep -c "^EXPO_PUBLIC_" .env.preview || true)
echo "   Contains $staging_count EXPO_PUBLIC_* variables"
echo ""

# Upload production .env file
echo "📤 Uploading .env.production as PRODUCTION_ENV_FILE..."
TEMP_ENV=$(mktemp)
grep -v '^\s*#' .env.production | grep -v '^\s*$' > "$TEMP_ENV"
echo "   Filtered $(wc -l < "$TEMP_ENV" | tr -d ' ') lines (removed comments and empty lines)"
gh secret set PRODUCTION_ENV_FILE < "$TEMP_ENV"
rm "$TEMP_ENV"
echo "✅ PRODUCTION_ENV_FILE uploaded successfully"
production_count=$(grep -c "^EXPO_PUBLIC_" .env.production || true)
echo "   Contains $production_count EXPO_PUBLIC_* variables"
echo ""

# ============================================
# Section 2: iOS / App Store Connect
# ============================================

echo "========================================"
echo "2. iOS / App Store Connect Secrets"
echo "========================================"
echo ""

# Apple ID
if [ -n "$APPLE_ID" ] && [[ "$APPLE_ID" != *"example.com"* ]]; then
    echo "📤 Uploading APPLE_ID..."
    gh secret set APPLE_ID --body "$APPLE_ID"
    echo "✅ APPLE_ID uploaded"
else
    echo "⚠️  Skipping APPLE_ID (not configured)"
    MISSING_VARS+=("APPLE_ID")
fi
echo ""

# App Store Connect API Key
if [ -n "$APP_STORE_CONNECT_API_KEY_PATH" ] && [ -f "$APP_STORE_CONNECT_API_KEY_PATH" ]; then
    echo "📤 Uploading App Store Connect API Key..."
    
    # Upload Key ID
    if [ -n "$APP_STORE_CONNECT_API_KEY_ID" ]; then
        gh secret set APP_STORE_CONNECT_API_KEY_ID --body "$APP_STORE_CONNECT_API_KEY_ID"
        echo "✅ APP_STORE_CONNECT_API_KEY_ID uploaded"
    else
        echo "⚠️  APP_STORE_CONNECT_API_KEY_ID not set"
        MISSING_VARS+=("APP_STORE_CONNECT_API_KEY_ID")
    fi
    
    # Upload Issuer ID
    if [ -n "$APP_STORE_CONNECT_ISSUER_ID" ]; then
        gh secret set APP_STORE_CONNECT_ISSUER_ID --body "$APP_STORE_CONNECT_ISSUER_ID"
        echo "✅ APP_STORE_CONNECT_ISSUER_ID uploaded"
    else
        echo "⚠️  APP_STORE_CONNECT_ISSUER_ID not set"
        MISSING_VARS+=("APP_STORE_CONNECT_ISSUER_ID")
    fi
    
    # Upload Key Content (preserving newlines with literal \n)
    # GitHub Actions expects literal \n in the secret, not actual newlines
    KEY_CONTENT=$(awk 'NF {printf "%s\\n", $0}' "$APP_STORE_CONNECT_API_KEY_PATH")
    gh secret set APP_STORE_CONNECT_API_KEY_CONTENT --body "$KEY_CONTENT"
    echo "✅ APP_STORE_CONNECT_API_KEY_CONTENT uploaded"
else
    echo "⚠️  Skipping App Store Connect API Key (file not found: $APP_STORE_CONNECT_API_KEY_PATH)"
    echo "   You can still use APPLE_ID authentication instead"
    MISSING_VARS+=("APP_STORE_CONNECT_API_KEY_PATH")
fi
echo ""

# Fastlane Match
echo "📤 Uploading Fastlane Match credentials..."

if [ -n "$MATCH_PASSWORD" ] && [[ "$MATCH_PASSWORD" != *"your-"* ]]; then
    gh secret set MATCH_PASSWORD --body "$MATCH_PASSWORD"
    echo "✅ MATCH_PASSWORD uploaded"
else
    echo "⚠️  MATCH_PASSWORD not configured"
    MISSING_VARS+=("MATCH_PASSWORD")
fi

# Match Git Authorization (base64 encode username:token)
if [ -n "$MATCH_GIT_USERNAME" ] && [ -n "$MATCH_GIT_TOKEN" ]; then
    MATCH_GIT_BASIC_AUTH=$(echo -n "${MATCH_GIT_USERNAME}:${MATCH_GIT_TOKEN}" | base64)
    gh secret set MATCH_GIT_BASIC_AUTHORIZATION --body "$MATCH_GIT_BASIC_AUTH"
    echo "✅ MATCH_GIT_BASIC_AUTHORIZATION uploaded (base64 encoded)"
else
    echo "⚠️  MATCH_GIT_USERNAME or MATCH_GIT_TOKEN not configured"
    MISSING_VARS+=("MATCH_GIT_USERNAME" "MATCH_GIT_TOKEN")
fi
echo ""

# ============================================
# Section 3: Android / Google Play
# ============================================

echo "========================================"
echo "3. Android / Google Play Secrets"
echo "========================================"
echo ""

# Android Keystore
if [ -n "$ANDROID_KEYSTORE_PATH" ] && [ -f "$ANDROID_KEYSTORE_PATH" ]; then
    echo "📤 Uploading Android Keystore..."
    ANDROID_KEYSTORE_BASE64=$(base64 -i "$ANDROID_KEYSTORE_PATH")
    gh secret set ANDROID_KEYSTORE_BASE64 --body "$ANDROID_KEYSTORE_BASE64"
    echo "✅ ANDROID_KEYSTORE_BASE64 uploaded ($(stat -f%z "$ANDROID_KEYSTORE_PATH") bytes, base64 encoded)"
    
    # Upload keystore credentials
    if [ -n "$ANDROID_KEYSTORE_PASSWORD" ]; then
        gh secret set ANDROID_KEYSTORE_PASSWORD --body "$ANDROID_KEYSTORE_PASSWORD"
        echo "✅ ANDROID_KEYSTORE_PASSWORD uploaded"
    else
        echo "⚠️  ANDROID_KEYSTORE_PASSWORD not set"
        MISSING_VARS+=("ANDROID_KEYSTORE_PASSWORD")
    fi
    
    if [ -n "$ANDROID_KEY_ALIAS" ]; then
        gh secret set ANDROID_KEY_ALIAS --body "$ANDROID_KEY_ALIAS"
        echo "✅ ANDROID_KEY_ALIAS uploaded"
    else
        echo "⚠️  ANDROID_KEY_ALIAS not set"
        MISSING_VARS+=("ANDROID_KEY_ALIAS")
    fi
    
    if [ -n "$ANDROID_KEY_PASSWORD" ]; then
        gh secret set ANDROID_KEY_PASSWORD --body "$ANDROID_KEY_PASSWORD"
        echo "✅ ANDROID_KEY_PASSWORD uploaded"
    else
        echo "⚠️  ANDROID_KEY_PASSWORD not set"
        MISSING_VARS+=("ANDROID_KEY_PASSWORD")
    fi
else
    echo "⚠️  Skipping Android Keystore (file not found: $ANDROID_KEYSTORE_PATH)"
    MISSING_VARS+=("ANDROID_KEYSTORE_PATH")
fi
echo ""

# Google Play Service Account
if [ -n "$GOOGLE_PLAY_JSON_KEY_PATH" ] && [ -f "$GOOGLE_PLAY_JSON_KEY_PATH" ]; then
    echo "📤 Uploading Google Play Service Account JSON..."
    GOOGLE_PLAY_JSON=$(cat "$GOOGLE_PLAY_JSON_KEY_PATH")
    gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON --body "$GOOGLE_PLAY_JSON"
    echo "✅ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON uploaded"
else
    echo "⚠️  Skipping Google Play Service Account (file not found: $GOOGLE_PLAY_JSON_KEY_PATH)"
    MISSING_VARS+=("GOOGLE_PLAY_JSON_KEY_PATH")
fi
echo ""

# ============================================
# Section 4: Firebase
# ============================================

echo "========================================"
echo "4. Firebase Configuration"
echo "========================================"
echo ""

# Firebase Token
if [ -n "$FIREBASE_TOKEN" ] && [[ "$FIREBASE_TOKEN" != *"your-"* ]]; then
    echo "📤 Uploading Firebase CI Token..."
    gh secret set FIREBASE_TOKEN --body "$FIREBASE_TOKEN"
    echo "✅ FIREBASE_TOKEN uploaded"
else
    echo "⚠️  FIREBASE_TOKEN not configured"
    echo "   Run: firebase login:ci"
    MISSING_VARS+=("FIREBASE_TOKEN")
fi
echo ""

# ============================================
# Summary
# ============================================

echo "========================================"
if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ All GitHub secrets configured successfully!"
else
    echo "⚠️  Setup complete with warnings"
fi
echo "========================================"
echo ""

echo "✅ Uploaded secrets:"
gh secret list | head -20
echo ""

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Missing or unconfigured variables:"
    printf '   • %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Update .env.github with the missing values and run this script again."
    echo ""
fi

echo "📚 What's been uploaded:"
echo "  • App environment variables (STAGING_ENV_FILE, PRODUCTION_ENV_FILE)"
echo "  • iOS/App Store Connect credentials"
echo "  • Android/Google Play credentials"
echo "  • Firebase token"
echo ""
echo "To view your secrets:"
echo "  gh secret list"
echo ""
echo "To update any secret:"
echo "  1. Update the corresponding file (.env.fastlane, .env.preview, etc.)"
echo "  2. Run this script again: ./scripts/setup-github-secrets.sh"
echo ""
