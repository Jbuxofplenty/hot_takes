# Hot Takes Authentication Setup

This guide covers the complete authentication setup for the Hot Takes app, including email/password, Google Sign-In, and Apple Sign-In.

## Features

- ✅ Email/Password authentication
- ✅ Google Sign-In
- ✅ Apple Sign-In (iOS)
- ✅ Password reset functionality
- ✅ User profile with display names
- ✅ Persistent authentication state
- ✅ Protected routes

## Architecture

### Components

1. **Firebase Config** (`src/config/firebase.ts`)

   - Initializes Firebase app
   - Configures Firebase Auth with AsyncStorage persistence
   - Sets up Firestore and Functions

2. **AuthContext** (`src/contexts/AuthContext.tsx`)

   - Provides authentication state and methods
   - Handles email/password, Google, and Apple sign-in
   - Manages user sessions

3. **LoginScreen** (`src/screens/LoginScreen.tsx`)

   - Clean, modern login/signup UI
   - Supports all authentication methods
   - Includes forgot password functionality

4. **Route Protection** (`app/index.tsx`)
   - Redirects unauthenticated users to login
   - Redirects authenticated users to main app

## Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

Required packages (already added to `package.json`):

- `firebase` - Firebase SDK
- `@react-native-async-storage/async-storage` - Local storage for auth persistence
- `@react-native-google-signin/google-signin` - Google Sign-In
- `expo-apple-authentication` - Apple Sign-In

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable Authentication methods:

   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google
   - Enable Apple (for iOS)

3. Get your Firebase configuration:

   - Go to Project Settings → General
   - Add an iOS app (use bundle ID from `app.json`)
   - Download `GoogleService-Info.plist` (already in project root)
   - Copy the Firebase config values to your `.env` file

4. Update `.env` file with your Firebase credentials:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### 3. Configure Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create OAuth 2.0 credentials:

   - Go to APIs & Services → Credentials
   - Create OAuth client ID for iOS
   - Create OAuth client ID for Web (required for Google Sign-In)

3. Update `.env` with your Google OAuth credentials:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```

4. Make sure `GoogleService-Info.plist` is in your project root

### 4. Configure Apple Sign-In (iOS Only)

1. Apple Developer Account Requirements:

   - Sign In with Apple capability must be enabled for your App ID
   - Already configured in `app.json`:
     ```json
     "ios": {
       "usesAppleSignIn": true
     }
     ```

2. Firebase Configuration:

   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Apple
   - Add your iOS Bundle ID
   - Configure Services ID (if needed for web)

3. Xcode Configuration (after prebuild):
   - The capability is automatically added via `app.json`
   - Verify in Xcode: Target → Signing & Capabilities → Sign in with Apple

## Usage

### Using Authentication in Your App

```typescript
import { useAuth } from '@/contexts';

function MyComponent() {
  const { user, logout } = useAuth();

  if (user) {
    return <Text>Welcome, {user.displayName}!</Text>;
  }

  return <Text>Please log in</Text>;
}
```

### Available Auth Methods

```typescript
const {
  user, // Current user object or null
  loading, // Loading state
  error, // Error message
  signIn, // Sign in with email/password
  signUp, // Sign up with email/password
  signInWithGoogle, // Sign in with Google
  signInWithApple, // Sign in with Apple
  logout, // Sign out
  resetPassword, // Send password reset email
} = useAuth();
```

### Protected Routes

Routes are automatically protected by the root `index.tsx`:

- Unauthenticated users → redirected to `/login`
- Authenticated users → redirected to `/(tabs)`

## File Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase initialization
├── contexts/
│   ├── AuthContext.tsx      # Authentication context
│   └── index.tsx           # Export all contexts
└── screens/
    └── LoginScreen.tsx     # Login/Signup UI

app/
├── _layout.tsx             # Root layout with AuthProvider
├── index.tsx               # Route protection logic
├── login.tsx               # Login route
└── (tabs)/
    ├── index.tsx           # Home screen with logout
    └── ...

public/
└── favicon.svg             # Flame logo

docs/
└── authentication-setup.md # This file
```

## Design

The login screen follows the Hot Takes brand design:

- Light gray background (#E8E8E8)
- Black buttons with white text
- Flame logo (🔥) at the top
- Clean, minimal inputs
- Rounded corners (25px)
- Social login buttons with icons

## Testing

1. **Email/Password Sign Up:**

   - Click "CREATE ACCOUNT"
   - Enter username, email, and password
   - Click "SIGN UP"

2. **Email/Password Sign In:**

   - Enter email and password
   - Click "LOGIN"

3. **Google Sign In:**

   - Click "🔍 Sign in with Google"
   - Select Google account
   - Approve permissions

4. **Apple Sign In (iOS only):**

   - Click "🍎 Sign in with Apple"
   - Use Face ID/Touch ID
   - Approve permissions

5. **Password Reset:**

   - Click "Forgot Password?"
   - Enter email
   - Click "SEND RESET LINK"
   - Check email for reset link

6. **Logout:**
   - Go to Home tab
   - Click "Logout" button

## Troubleshooting

### Google Sign-In Issues

1. **"Sign in failed" error:**

   - Verify `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is correct
   - Make sure iOS client ID matches bundle identifier
   - Check `GoogleService-Info.plist` is in project root

2. **"No ID token received":**
   - Ensure OAuth consent screen is configured in Google Cloud Console
   - Add test users if in development mode

### Apple Sign-In Issues

1. **"Apple Sign-In not available":**

   - Only works on physical iOS devices or iOS 13+ simulator
   - Verify `usesAppleSignIn: true` in `app.json`
   - Run `npx expo prebuild` to regenerate native projects

2. **"Invalid credential" error:**
   - Ensure Apple Sign-In is enabled in Firebase Console
   - Verify bundle ID matches in both Firebase and Apple Developer

### Firebase Issues

1. **"Auth domain not configured":**

   - Check all Firebase env variables are set correctly
   - Restart Expo dev server after changing `.env`

2. **"Persistence error":**
   - Clear app data/cache
   - Reinstall the app
   - Verify AsyncStorage is working

## Security Notes

1. **Environment Variables:**

   - Never commit `.env` to git (already in `.gitignore`)
   - Use `.env.example` as template
   - Different values for dev/staging/prod

2. **Firebase Security Rules:**

   - Configure Firestore rules to protect user data
   - Use Firebase Authentication for API access control

3. **OAuth Credentials:**
   - Keep OAuth client secrets secure
   - Rotate credentials if compromised
   - Use different credentials for each environment

## Next Steps

1. **User Profiles:**

   - Store additional user data in Firestore
   - Add profile editing functionality

2. **Email Verification:**

   - Send verification emails on signup
   - Require verification before accessing certain features

3. **Social Features:**

   - Connect authentication with social features
   - Display user profiles
   - Follow/friend functionality

4. **Analytics:**
   - Track authentication events
   - Monitor sign-in methods usage
   - Identify drop-off points

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In Setup](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Apple Sign-In Setup](https://developer.apple.com/sign-in-with-apple/)
- [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
