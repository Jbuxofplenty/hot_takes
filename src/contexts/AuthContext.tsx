import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import {
    AuthError,
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

// Lazy import for native module
let GoogleSignin: any = null;
try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
    console.log('Google Sign-In module not available:', error);
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithGoogle: () => Promise<any>;
    signInWithApple: () => Promise<any>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Configure Google Sign-In
    useEffect(() => {
        if (GoogleSignin) {
            GoogleSignin.configure({
                webClientId:
                    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
                    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
                iosClientId:
                    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
                    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
                offlineAccess: true,
            });
        }
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const authError = err as AuthError;
            setError(getErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            setError(null);
            setLoading(true);
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with display name
            if (result.user) {
                await updateProfile(result.user, { displayName });
            }
        } catch (err) {
            const authError = err as AuthError;
            setError(getErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        if (!GoogleSignin) {
            const errorMessage =
                'Google Sign-In is not available. Please rebuild the app with: npx expo run:ios';
            setError(errorMessage);
            throw new Error(errorMessage);
        }

        try {
            setError(null);
            setLoading(true);

            // Check if your device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Get the users ID token
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (!idToken) {
                throw new Error('No ID token received from Google');
            }

            // Create a Google credential with the token
            const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
            const googleCredential = GoogleAuthProvider.credential(idToken);

            // Sign-in the user with the credential
            return await signInWithCredential(auth, googleCredential);
        } catch (err: any) {
            if (err.code === 'SIGN_IN_CANCELLED' || err.code === '-5') {
                // User cancelled the sign-in flow
                return null;
            }
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signInWithApple = async () => {
        try {
            setError(null);
            setLoading(true);

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // Sign in with Apple credential
            const { identityToken, fullName } = credential;
            if (!identityToken) {
                throw new Error('No identity token received from Apple');
            }

            const { OAuthProvider, signInWithCredential } = await import('firebase/auth');
            const provider = new OAuthProvider('apple.com');
            const appleCredential = provider.credential({
                idToken: identityToken,
            });

            const result = await signInWithCredential(auth, appleCredential);

            // Update profile with name if available
            if (result.user && fullName?.givenName) {
                const displayName = [fullName.givenName, fullName.familyName]
                    .filter(Boolean)
                    .join(' ');
                await updateProfile(result.user, { displayName });
            }

            return result;
        } catch (err: any) {
            if (err.code === 'ERR_REQUEST_CANCELED') {
                // User cancelled the sign-in flow
                return null;
            }
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setError(null);
            setLoading(true);

            // Sign out from Google if signed in
            try {
                if (GoogleSignin && typeof GoogleSignin.isSignedIn === 'function') {
                    const isSignedIn = await GoogleSignin.isSignedIn();
                    if (isSignedIn) {
                        await GoogleSignin.signOut();
                    }
                }
            } catch (googleError) {
                // Google Sign-In not available, continue with Firebase sign out
                console.log('Google Sign-Out not available:', googleError);
            }

            await signOut(auth);
        } catch (err) {
            const authError = err as AuthError;
            setError(getErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            setError(null);
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            const authError = err as AuthError;
            setError(getErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        logout,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function getErrorMessage(error: AuthError | any): string {
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password';
        case 'auth/email-already-in-use':
            return 'Email already in use';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/operation-not-allowed':
            return 'Operation not allowed';
        case 'auth/too-many-requests':
            return 'Too many requests. Please try again later';
        default:
            return error.message || 'An error occurred';
    }
}
