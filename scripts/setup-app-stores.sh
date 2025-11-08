#!/bin/bash

# Setup App on App Store Connect and Google Play Console
# This script helps initialize com.jbuxofplenty.hottakes on both stores

set -e

echo "🚀 Hot Takes - App Store Initialization Script"
echo "================================================"
echo ""
echo "This script will help you create 'Hot Takes' on:"
echo "  • App Store Connect (iOS)"
echo "  • Google Play Console (Android)"
echo ""
echo "Bundle ID: com.jbuxofplenty.hottakes"
echo ""

# ============================================
# Check Prerequisites
# ============================================

echo "🔍 Checking prerequisites..."
echo ""

# Check if fastlane is installed
if ! command -v bundle &> /dev/null || ! bundle exec fastlane --version &> /dev/null 2>&1; then
    echo "❌ Fastlane not found. Installing..."
    bundle install
fi

# Check if .env.fastlane exists
if [ ! -f ".env.fastlane" ]; then
    echo "❌ Error: .env.fastlane not found!"
    echo "Please create .env.fastlane with your Apple/Google credentials"
    exit 1
fi

# Load environment variables
source .env.fastlane

echo "✅ Prerequisites checked"
echo ""

# ============================================
# iOS - App Store Connect Setup
# ============================================

echo "================================================"
echo "📱 iOS - App Store Connect Setup"
echo "================================================"
echo ""

echo "This will create the app in App Store Connect using Fastlane Produce."
echo ""
echo "App Details:"
echo "  • App Name: Hot Takes"
echo "  • Bundle ID: com.jbuxofplenty.hottakes"
echo "  • SKU: hottakes"
echo "  • Language: English (US)"
echo ""

read -p "Create iOS app in App Store Connect? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔨 Creating iOS app..."
    
    # Check if using API Key or Apple ID auth
    if [ -n "$APP_STORE_CONNECT_API_KEY_PATH" ] && [ -f "$APP_STORE_CONNECT_API_KEY_PATH" ]; then
        echo "Using App Store Connect API Key authentication..."
        
        bundle exec fastlane produce \
            --app_identifier "com.jbuxofplenty.hottakes" \
            --app_name "Hot Takes" \
            --language "en-US" \
            --sku "hottakes" \
            --team_id "$IOS_TEAM_ID" \
            --api_key_path "$APP_STORE_CONNECT_API_KEY_PATH" \
            --skip_itc false \
            --skip_devcenter false
    else
        echo "Using Apple ID authentication..."
        
        if [ -z "$APPLE_ID" ]; then
            echo "❌ Error: APPLE_ID not set in .env.fastlane"
            exit 1
        fi
        
        bundle exec fastlane produce \
            --app_identifier "com.jbuxofplenty.hottakes" \
            --app_name "Hot Takes" \
            --language "en-US" \
            --sku "hottakes" \
            --team_id "$IOS_TEAM_ID" \
            --username "$APPLE_ID" \
            --skip_itc false \
            --skip_devcenter false
    fi
    
    echo ""
    echo "✅ iOS app created in App Store Connect!"
    echo ""
    echo "Next steps for iOS:"
    echo "  1. Visit: https://appstoreconnect.apple.com"
    echo "  2. Configure app metadata (description, screenshots, etc.)"
    echo "  3. Set up App Store categories and age rating"
    echo "  4. Add app privacy details"
    echo ""
else
    echo "⏭️  Skipping iOS app creation"
    echo ""
fi

# ============================================
# iOS - Match Setup
# ============================================

echo "================================================"
echo "🔐 iOS - Fastlane Match Setup"
echo "================================================"
echo ""

echo "Setting up code signing with Fastlane Match..."
echo ""

read -p "Initialize Fastlane Match for code signing? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔨 Setting up Match..."
    
    # Create match repository if it doesn't exist
    echo "You'll need a private GitHub repository for storing certificates."
    echo "Example: https://github.com/jbuxofplenty/hottakes-certificates"
    echo ""
    read -p "Enter Match repository URL: " MATCH_REPO_URL
    
    if [ -z "$MATCH_REPO_URL" ]; then
        echo "❌ Repository URL required"
    else
        # Initialize Match for development and appstore
        echo ""
        echo "Creating development certificates..."
        MATCH_GIT_URL="$MATCH_REPO_URL" bundle exec fastlane match development \
            --app_identifier "com.jbuxofplenty.hottakes" \
            --readonly false
        
        echo ""
        echo "Creating App Store certificates..."
        MATCH_GIT_URL="$MATCH_REPO_URL" bundle exec fastlane match appstore \
            --app_identifier "com.jbuxofplenty.hottakes" \
            --readonly false
        
        echo ""
        echo "✅ Match setup complete!"
        echo ""
        echo "Certificates and provisioning profiles are now stored in:"
        echo "  $MATCH_REPO_URL"
        echo ""
    fi
else
    echo "⏭️  Skipping Match setup"
    echo ""
fi

# ============================================
# Android - Google Play Console Setup
# ============================================

echo "================================================"
echo "🤖 Android - Google Play Console Setup"
echo "================================================"
echo ""

echo "⚠️  Android app creation MUST be done manually via Google Play Console."
echo ""
echo "Unfortunately, Google doesn't provide a CLI tool to create apps."
echo "You'll need to complete these steps manually:"
echo ""
echo "📋 Manual Steps Required:"
echo ""
echo "1. Go to: https://play.google.com/console"
echo "2. Click 'Create app'"
echo "3. Enter app details:"
echo "   • App name: Hot Takes"
echo "   • Default language: English (United States)"
echo "   • App or game: Game"
echo "   • Free or paid: Free"
echo "4. Complete the app declaration questions"
echo "5. Accept the Developer Program Policies"
echo ""
echo "After creating the app:"
echo ""
echo "6. Go to: Production → Create new release"
echo "7. Upload the FIRST build manually (subsequent builds will be automated)"
echo "8. To get your first build:"
echo ""
echo "   # Generate the Android app"
echo "   npx expo prebuild --platform android --clean"
echo ""
echo "   # Build an AAB file locally"
echo "   cd android"
echo "   ./gradlew bundleRelease"
echo ""
echo "   # The AAB will be at:"
echo "   # android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "9. After uploading first build, set up Internal Testing track"
echo "10. Enable API access and link your service account"
echo ""
echo "📝 Service Account Setup:"
echo ""
echo "1. Go to: Play Console → Setup → API access"
echo "2. Link to Google Cloud project"
echo "3. Create service account credentials"
echo "4. Grant 'Release manager' permission"
echo "5. Download JSON key and save as: google-play-service-account.json"
echo ""

read -p "Press Enter when you've completed the Google Play Console setup..." -r
echo ""

# ============================================
# Generate Signing Key (if needed)
# ============================================

if [ ! -f "./release.keystore" ]; then
    echo "================================================"
    echo "🔑 Android - Generate Signing Key"
    echo "================================================"
    echo ""
    
    read -p "Generate Android signing keystore? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Enter keystore details:"
        read -p "Keystore password: " KEYSTORE_PASSWORD
        read -p "Key alias (e.g., hottakes): " KEY_ALIAS
        read -p "Key password: " KEY_PASSWORD
        read -p "Your name: " DNAME_CN
        read -p "Organization (e.g., JBuxOfPlenty): " DNAME_O
        
        echo ""
        echo "Generating keystore..."
        
        keytool -genkey -v \
            -keystore ./release.keystore \
            -alias "$KEY_ALIAS" \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass "$KEYSTORE_PASSWORD" \
            -keypass "$KEY_PASSWORD" \
            -dname "CN=$DNAME_CN, O=$DNAME_O, C=US"
        
        echo ""
        echo "✅ Keystore created: ./release.keystore"
        echo ""
        echo "⚠️  IMPORTANT: Update .env.fastlane with:"
        echo "  ANDROID_KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD"
        echo "  ANDROID_KEY_ALIAS=$KEY_ALIAS"
        echo "  ANDROID_KEY_PASSWORD=$KEY_PASSWORD"
        echo ""
    fi
fi

# ============================================
# Update GitHub Configuration
# ============================================

echo "================================================"
echo "⚙️  GitHub Actions Configuration"
echo "================================================"
echo ""

echo "You need to set these GitHub Variables (Settings → Secrets → Variables):"
echo ""
echo "iOS Variables:"
echo "  IOS_APP_IDENTIFIER=com.jbuxofplenty.hottakes"
echo "  IOS_TEAM_ID=$IOS_TEAM_ID"
echo "  IOS_SCHEME=hottakes"
echo "  IOS_WORKSPACE_PATH=./ios/hottakes.xcworkspace"
echo "  IOS_PROJECT_PATH=./ios/hottakes.xcodeproj"
echo "  IOS_OUTPUT_NAME=hottakes.ipa"
echo ""
echo "Android Variables:"
echo "  ANDROID_PACKAGE_NAME=com.jbuxofplenty.hottakes"
echo "  ANDROID_PROJECT_DIR=./android"
echo ""
echo "Firebase Variables:"
echo "  FIREBASE_PROJECT_ID=<your-firebase-project-id>"
echo ""

read -p "Set GitHub Variables automatically? (requires gh CLI) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v gh &> /dev/null; then
        echo ""
        echo "Setting GitHub Variables..."
        
        gh variable set IOS_APP_IDENTIFIER --body "com.jbuxofplenty.hottakes"
        gh variable set IOS_TEAM_ID --body "${IOS_TEAM_ID:-YOUR_TEAM_ID}"
        gh variable set IOS_SCHEME --body "hottakes"
        gh variable set IOS_WORKSPACE_PATH --body "./ios/hottakes.xcworkspace"
        gh variable set IOS_PROJECT_PATH --body "./ios/hottakes.xcodeproj"
        gh variable set IOS_OUTPUT_NAME --body "hottakes.ipa"
        
        gh variable set ANDROID_PACKAGE_NAME --body "com.jbuxofplenty.hottakes"
        gh variable set ANDROID_PROJECT_DIR --body "./android"
        
        echo ""
        echo "✅ GitHub Variables set!"
        echo ""
        echo "⚠️  Don't forget to set FIREBASE_PROJECT_ID manually:"
        echo "  gh variable set FIREBASE_PROJECT_ID --body '<your-project-id>'"
        echo ""
    else
        echo ""
        echo "❌ GitHub CLI not installed. Set variables manually."
        echo ""
    fi
else
    echo ""
    echo "⏭️  Set variables manually at:"
    echo "  https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/variables/actions"
    echo ""
fi

# ============================================
# Summary
# ============================================

echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "📱 iOS App: com.jbuxofplenty.hottakes"
echo "🤖 Android App: com.jbuxofplenty.hottakes"
echo ""
echo "Next Steps:"
echo ""
echo "1. Upload secrets to GitHub:"
echo "   ./scripts/setup-github-secrets.sh"
echo ""
echo "2. Set GitHub Variables (if not done above)"
echo ""
echo "3. Test local builds:"
echo "   npx expo prebuild --platform ios --clean"
echo "   npx expo prebuild --platform android --clean"
echo ""
echo "4. Push to develop branch to trigger first CI/CD build:"
echo "   git push origin develop"
echo ""
echo "5. Monitor the build at:"
echo "   https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""

