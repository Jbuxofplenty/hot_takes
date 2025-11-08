# Android Keystore SHA Fingerprints

**Generated:** November 8, 2024

## Release Keystore (Production)

**File:** `fastlane/hot-takes-release.keystore`  
**Alias:** `hottakes`

```
SHA-1:  41:48:FD:0C:F2:E3:81:8B:F7:78:4C:BE:33:26:EE:7E:53:06:C1:11
SHA-256: 3D:DA:53:C2:1E:E9:52:F3:98:A8:AF:B2:D4:92:90:BC:4C:02:94:BD:D9:73:A3:40:DC:79:2A:03:FE:B1:BC:FC
```

## Debug Keystore (Development)

**File:** `~/.android/debug.keystore`  
**Alias:** `androiddebugkey`

To generate debug fingerprints:

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

## Where These Are Used

### Firebase Console

- **Location:** Project Settings → Your apps → Android app
- **Required:** SHA-1 and SHA-256 for both release and debug
- **Purpose:** Firebase Authentication, Dynamic Links, Cloud Messaging

### Google Cloud Console

- **Location:** APIs & Services → Credentials → OAuth 2.0 Client IDs
- **Required:** SHA-1 for release
- **Purpose:** Google Sign-In

### Google Play Console

- **Location:** Release → Setup → App integrity
- **Note:** After first upload, Google generates its own app signing key
- **Important:** Use Google's signing certificate SHA-1 for production services!

## Commands Reference

### Get Release Keystore Fingerprints

```bash
keytool -list -v \
  -keystore fastlane/hot-takes-release.keystore \
  -alias hottakes \
  -storepass <your-password> \
  -keypass <your-password>
```

### Get Debug Keystore Fingerprints

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

### Get Google Play Signing Certificate (after first upload)

```bash
# From Google Play Console
# Release → Setup → App integrity → App signing key certificate
# Copy the SHA-1 and SHA-256 shown there
```

## Security Notes

- ⚠️ **Never commit** keystore files to git
- ⚠️ **Never share** keystore passwords publicly
- ✅ These SHA fingerprints are **safe to share** - they're public identifiers
- ✅ Google Play will manage your production signing key after first upload
