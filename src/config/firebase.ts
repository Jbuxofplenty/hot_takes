import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence is React Native specific, available at runtime
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
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

// Determine if we should use emulators
const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && __DEV__;

// Initialize Auth with persistence (avoid re-initialization on hot reload)
// Check if auth is already initialized by checking _authInstances
// @ts-expect-error - accessing internal Firebase property for hot reload handling
const isAuthInitialized = app._authInstances && app._authInstances.size > 0;

let auth;
if (isAuthInitialized) {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
    
    // Connect Auth Emulator immediately after initialization
    if (useEmulator) {
        try {
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
            console.log('🔐 Auth connected to emulator');
        } catch (error) {
            console.log('⚠️ Auth emulator already connected');
        }
    }
}

// Initialize Firestore and connect to emulator BEFORE any operations
const db = getFirestore(app);
if (useEmulator) {
    try {
        // @ts-expect-error - _settings is internal
        if (!db._settings?.host?.includes('localhost')) {
            connectFirestoreEmulator(db, 'localhost', 8080);
            console.log('🗄️ Firestore connected to emulator');
        }
    } catch (error) {
        console.log('⚠️ Firestore emulator already connected');
    }
}

// Initialize Functions and connect to emulator
const functions = getFunctions(app);
if (useEmulator) {
    try {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('⚡ Functions connected to emulator');
    } catch (error) {
        console.log('⚠️ Functions emulator already connected');
    }
}

if (useEmulator) {
    console.log('✅ All Firebase services connected to emulators');
}

export { app, auth, db, functions };
