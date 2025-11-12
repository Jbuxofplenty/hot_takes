import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence is React Native specific, available at runtime
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY ||
        process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_DATABASE_URL ||
        process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
        process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID ||
        process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ||
        process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Functions
const functions = getFunctions(app);

// Connect to emulators if configured
const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
if (useEmulator && __DEV__) {
    console.log('🔧 Connecting to Firebase Emulators...');
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app, auth, db, functions };
