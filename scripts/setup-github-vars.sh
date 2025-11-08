#!/bin/bash

# Setup GitHub Variables for Hot Takes
# This script uploads repository variables for CI/CD workflows
# Variables are non-sensitive configuration values shown as plain text

set -e

echo "🔧 Setting up GitHub Variables for Hot Takes..."
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
# iOS Configuration Variables
# ============================================

echo "========================================"
echo "1. iOS App Configuration"
echo "========================================"
echo ""

# These values come from your app.json and Xcode project
IOS_APP_IDENTIFIER="${IOS_APP_IDENTIFIER:-com.jbuxofplenty.hottakes}"
IOS_TEAM_ID="${IOS_TEAM_ID:-FWV22U8U39}"
IOS_SCHEME="${IOS_SCHEME:-HotTakes}"
IOS_WORKSPACE_PATH="${IOS_WORKSPACE_PATH:-./ios/HotTakes.xcworkspace}"
IOS_PROJECT_PATH="${IOS_PROJECT_PATH:-./ios/HotTakes.xcodeproj}"
IOS_OUTPUT_NAME="${IOS_OUTPUT_NAME:-HotTakes.ipa}"

echo "📤 Setting iOS configuration variables..."
gh variable set IOS_APP_IDENTIFIER --body "$IOS_APP_IDENTIFIER"
echo "✅ IOS_APP_IDENTIFIER: $IOS_APP_IDENTIFIER"

gh variable set IOS_TEAM_ID --body "$IOS_TEAM_ID"
echo "✅ IOS_TEAM_ID: $IOS_TEAM_ID"

gh variable set IOS_SCHEME --body "$IOS_SCHEME"
echo "✅ IOS_SCHEME: $IOS_SCHEME"

gh variable set IOS_WORKSPACE_PATH --body "$IOS_WORKSPACE_PATH"
echo "✅ IOS_WORKSPACE_PATH: $IOS_WORKSPACE_PATH"

gh variable set IOS_PROJECT_PATH --body "$IOS_PROJECT_PATH"
echo "✅ IOS_PROJECT_PATH: $IOS_PROJECT_PATH"

gh variable set IOS_OUTPUT_NAME --body "$IOS_OUTPUT_NAME"
echo "✅ IOS_OUTPUT_NAME: $IOS_OUTPUT_NAME"

echo ""

# ============================================
# Android Configuration Variables
# ============================================

echo "========================================"
echo "2. Android App Configuration"
echo "========================================"
echo ""

# These values come from your app.json and Android project
ANDROID_PACKAGE_NAME="${ANDROID_PACKAGE_NAME:-com.jbuxofplenty.hottakes}"
# Path relative to repo root (where 'bundle exec fastlane' runs from)
ANDROID_PROJECT_DIR="${ANDROID_PROJECT_DIR:-./android}"

echo "📤 Setting Android configuration variables..."
gh variable set ANDROID_PACKAGE_NAME --body "$ANDROID_PACKAGE_NAME"
echo "✅ ANDROID_PACKAGE_NAME: $ANDROID_PACKAGE_NAME"

gh variable set ANDROID_PROJECT_DIR --body "$ANDROID_PROJECT_DIR"
echo "✅ ANDROID_PROJECT_DIR: $ANDROID_PROJECT_DIR"

echo ""

# ============================================
# Summary
# ============================================

echo "========================================"
echo "✅ All GitHub variables configured!"
echo "========================================"
echo ""

echo "📋 Variables set:"
gh variable list
echo ""

echo "📚 What's been configured:"
echo "  • iOS app identifier, team ID, and build paths"
echo "  • Android package name and project directory"
echo ""

echo "💡 To update any variable:"
echo "  1. Edit the values in this script or set env vars before running"
echo "  2. Run this script again: ./scripts/setup-github-vars.sh"
echo ""

echo "🔐 Don't forget to also run:"
echo "  ./scripts/setup-github-secrets.sh"
echo ""

