# Push Notifications Setup Guide

This guide walks you through setting up Expo Push Notifications for both iOS and Android using Firebase Cloud Messaging (FCM V1) and Apple Push Notification service (APNs).

## Prerequisites

- ✅ Firebase project created
- ✅ `google-services.json` in project root (Android)
- ✅ `GoogleService-Info.plist` in project root (iOS)
- ✅ `expo-notifications` plugin configured in app.json
- ✅ EAS CLI installed (`npm install -g eas-cli`)

## Android Setup (FCM V1)

### 1. Create Google Service Account Key

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project settings** > **Service accounts**
4. Click **"Generate New Private Key"**
5. Click **"Generate Key"** to confirm
6. Save the downloaded JSON file as `google-service-account.json` in your project root

> **⚠️ Important**: This file contains sensitive credentials and is already in `.gitignore`. Never commit it to your repository.

### 2. Upload to EAS

Run the following command:

```bash
eas credentials
```

Then follow these steps:

1. Select **Android**
2. Select **production** (or the environment you want to configure)
3. Select **Google Service Account**
4. Select **Manage your Google Service Account Key for Push Notifications (FCM V1)**
5. Select **Set up a Google Service Account Key for Push Notifications (FCM V1)**
6. Select **Upload a new service account key**
7. When prompted, press **Y** to select the `google-service-account.json` file

Alternatively, you can upload via [Expo Dashboard](https://expo.dev/):

1. Go to **Project settings** > **Credentials**
2. Under Android, select your Application Identifier
3. Under **Service Credentials** > **FCM V1 service account key**, click **Add a service account key**
4. Upload your `google-service-account.json` file

### 3. Verify Android Configuration

Your `app.json` should have (already configured ✅):

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.jbuxofplenty.hottakes"
    }
  }
}
```

## iOS Setup (APNs)

### 1. Set Up APNs Key

You need an APNs Authentication Key from Apple Developer:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Click **+** to create a new key
3. Give it a name (e.g., "Hot Takes Push Notifications")
4. Check **Apple Push Notifications service (APNs)**
5. Click **Continue** and then **Register**
6. Download the `.p8` file (you can only download it once!)
7. Note the **Key ID** (10 character string)
8. Note your **Team ID** (found in top right of Developer Portal)

### 2. Upload APNs Key to EAS

Run:

```bash
eas credentials
```

Then follow these steps:

1. Select **iOS**
2. Select **production** (or the environment you want to configure)
3. Select **Push Notifications: Apple Push Notifications service key**
4. Select **Set up a Apple Push Notifications service key**
5. Choose to **Upload a new key**
6. Provide the path to your `.p8` file
7. Enter your **Key ID**
8. Enter your **Team ID** (should be `FWV22U8U39` based on your app.json)

Alternatively, you can upload via [Expo Dashboard](https://expo.dev/):

1. Go to **Project settings** > **Credentials**
2. Under iOS, select your Bundle Identifier
3. Under **Service Credentials** > **Apple Push Notification service key**, click **Add**
4. Upload your `.p8` file and enter Key ID and Team ID

### 3. Verify iOS Configuration

Your `app.json` should have (already configured ✅):

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.jbuxofplenty.hottakes",
      "appleTeamId": "FWV22U8U39"
    }
  }
}
```

## Testing Push Notifications

### 1. Install Required Package

If not already installed:

```bash
yarn add expo-notifications
```

### 2. Request Permissions and Get Push Token

Add this code to your app (e.g., in `app/_layout.tsx` or a dedicated notifications service):

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions and get push token
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  try {
    const projectId = '1a0f5d8b-c240-4c59-bbcd-d1fa29d2a7f1'; // Your EAS project ID
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}
```

### 3. Send a Test Notification

Once you have a push token, you can test using Expo's push notification tool:

1. Go to https://expo.dev/notifications
2. Enter your push token (starts with `ExponentPushToken[...]`)
3. Enter a title and message
4. Click **Send a Notification**

Or use curl:

```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
  "title": "Test Notification",
  "body": "Hello from Hot Takes!",
  "data": { "type": "test" }
}'
```

## Verification Checklist

- [ ] Downloaded `google-service-account.json` from Firebase
- [ ] Uploaded Google Service Account Key to EAS (Android)
- [ ] Downloaded APNs `.p8` key from Apple Developer Portal
- [ ] Uploaded APNs key to EAS (iOS)
- [ ] Implemented notification permission request in app
- [ ] Received push token successfully
- [ ] Sent and received test notification on Android device/emulator
- [ ] Sent and received test notification on iOS device/simulator

## Troubleshooting

### Android Issues

**"Invalid credentials" error**

- Ensure you uploaded the correct `google-service-account.json` file
- Verify the service account has "Firebase Messaging API Admin" role
- Check that `google-services.json` matches your Firebase project

**Notifications not appearing**

- Check notification channel is properly configured (Android 8.0+)
- Verify app has notification permissions enabled in device settings
- Test on a physical device (emulators can be unreliable)

### iOS Issues

**"Invalid APNs key" error**

- Verify Team ID matches your Apple Developer account
- Ensure Key ID is correct (10 character string)
- Check that APNs capability is enabled for the key

**Notifications not appearing**

- Test on a physical device (simulators don't support push notifications)
- Verify app has notification permissions in iOS Settings
- Check that Bundle ID matches in all configurations

**"No APNs token" error**

- Physical device required (simulators don't support APNs)
- Ensure proper code signing and provisioning profile
- Check that push notification capability is enabled in Apple Developer Portal

### General Issues

**No push token received**

- Check internet connection
- Verify EAS project ID is correct
- Check console logs for detailed error messages
- Ensure app is built with EAS (not Expo Go for production)

**Notifications work on one platform but not the other**

- Verify credentials are set up for both platforms
- Check platform-specific configuration in `app.json`
- Test on actual devices (not simulators/emulators)

## Additional Resources

- [Expo Push Notifications Overview](https://docs.expo.dev/push-notifications/overview/)
- [FCM V1 Credentials Guide](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Send Notifications with FCM and APNs](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Handle Incoming Notifications](https://docs.expo.dev/push-notifications/receiving-notifications/)
- [Push Notifications FAQ](https://docs.expo.dev/push-notifications/faq/)

## Next Steps

1. Complete the credential upload process above
2. Implement the notification permission flow in your app
3. Store push tokens in your Firebase backend
4. Set up backend logic to send notifications (e.g., Cloud Functions)
5. Test thoroughly on both platforms
6. Monitor delivery rates and handle notification interactions
