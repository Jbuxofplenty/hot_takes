import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

import { ThemedInput } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('screen');
const isTablet = width >= 768;

export default function LoginScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const {
        user,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        resetPassword,
        loading: authLoading,
        error: authError,
    } = useAuth();

    const [isSignUp, setIsSignUp] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
    const [isOver18, setIsOver18] = useState(false);
    const [acceptedContestTerms, setAcceptedContestTerms] = useState(false);

    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const usernameRef = useRef<TextInput>(null);

    // Check if Apple Authentication is available
    useEffect(() => {
        const checkAppleAuth = async () => {
            try {
                const available = await AppleAuthentication.isAvailableAsync();
                setIsAppleAuthAvailable(available);
            } catch (error) {
                console.log('Apple Sign-In check error:', error);
                setIsAppleAuthAvailable(false);
            }
        };
        checkAppleAuth();
    }, []);

    // Redirect if user is logged in
    useEffect(() => {
        if (user) {
            router.replace('/(tabs)');
        }
    }, [user, router]);

    const handleSubmit = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (isSignUp) {
            const trimmedUsername = username?.trim();

            if (!trimmedUsername) {
                setError('Username is required');
                return;
            }

            if (trimmedUsername.length < 2) {
                setError('Username must be at least 2 characters');
                return;
            }

            if (trimmedUsername.length > 30) {
                setError('Username must be less than 30 characters');
                return;
            }

            if (!/^[a-zA-Z0-9 _-]+$/.test(trimmedUsername)) {
                setError(
                    'Username can only contain letters, numbers, spaces, underscores, and hyphens'
                );
                return;
            }

            if (!isOver18) {
                setError('You must be 18 or older to create an account');
                return;
            }

            if (!acceptedContestTerms) {
                setError('You must accept the contest terms to continue');
                return;
            }
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            if (isSignUp) {
                await signUp(email, password, username.trim());
            } else {
                await signIn(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const result = await signInWithGoogle();
            if (result === null) {
                console.log('User cancelled Google Sign-In');
            }
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const result = await signInWithApple();
            if (result === null) {
                console.log('User cancelled Apple Sign-In');
            }
        } catch (err: any) {
            setError(err.message || 'Apple sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await resetPassword(email);
            setSuccessMessage('Password reset email sent! Check your inbox.');
            setShowForgotPassword(false);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setShowForgotPassword(false);
        setError('');
        setSuccessMessage('');
        setIsOver18(false);
        setAcceptedContestTerms(false);
    };

    const toggleForgotPassword = () => {
        setShowForgotPassword(!showForgotPassword);
        setError('');
        setSuccessMessage('');
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.flameIcon}>
                        <Text
                            style={[
                                styles.flameEmoji,
                                { fontSize: isTablet ? moderateScale(40) : moderateScale(50) },
                            ]}
                        >
                            🔥
                        </Text>
                    </View>
                    <Text
                        style={[
                            styles.title,
                            {
                                color: colors.TEXT,
                                fontSize: isTablet ? moderateScale(24) : moderateScale(32),
                            },
                        ]}
                    >
                        Hot Takes
                    </Text>
                </View>

                {/* Error/Success Messages */}
                {(error || authError) && (
                    <View style={[styles.errorContainer, { backgroundColor: colors.ERROR_BG }]}>
                        <Text
                            style={[
                                styles.errorText,
                                {
                                    color: colors.ERROR,
                                    fontSize: isTablet ? moderateScale(11) : moderateScale(14),
                                },
                            ]}
                        >
                            {error || authError}
                        </Text>
                    </View>
                )}

                {successMessage && (
                    <View style={[styles.successContainer, { backgroundColor: colors.SUCCESS_BG }]}>
                        <Text
                            style={[
                                styles.successText,
                                {
                                    color: colors.SUCCESS,
                                    fontSize: isTablet ? moderateScale(11) : moderateScale(14),
                                },
                            ]}
                        >
                            {successMessage}
                        </Text>
                    </View>
                )}

                {/* Form */}
                <View style={styles.formContainer}>
                    {!showForgotPassword && (
                        <>
                            {/* Social Sign-In Icons */}
                            <View style={styles.socialButtonsContainer}>
                                {isAppleAuthAvailable && (
                                    <TouchableOpacity
                                        style={[
                                            styles.socialIconButton,
                                            {
                                                backgroundColor: colors.INPUT,
                                                borderColor: colors.INPUT_BORDER,
                                            },
                                        ]}
                                        onPress={handleAppleSignIn}
                                        disabled={loading || authLoading}
                                    >
                                        <Ionicons
                                            name='logo-apple'
                                            size={verticalScale(24)}
                                            color={colors.TEXT}
                                        />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.socialIconButton,
                                        {
                                            backgroundColor: colors.INPUT,
                                            borderColor: colors.INPUT_BORDER,
                                        },
                                    ]}
                                    onPress={handleGoogleSignIn}
                                    disabled={loading || authLoading}
                                >
                                    <Ionicons
                                        name='logo-google'
                                        size={verticalScale(24)}
                                        color='#DB4437'
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Divider */}
                            <View
                                style={[
                                    styles.dividerContainer,
                                    { marginVertical: isTablet ? scale(12) : scale(16) },
                                ]}
                            >
                                <View
                                    style={[styles.divider, { backgroundColor: colors.DIVIDER }]}
                                />
                                <Text
                                    style={[
                                        styles.dividerText,
                                        {
                                            color: colors.TEXT_SECONDARY,
                                            fontSize: isTablet
                                                ? moderateScale(10)
                                                : moderateScale(12),
                                        },
                                    ]}
                                >
                                    OR
                                </Text>
                                <View
                                    style={[styles.divider, { backgroundColor: colors.DIVIDER }]}
                                />
                            </View>

                            {/* Username Input (Sign Up Only) */}
                            {isSignUp && (
                                <TextInput
                                    ref={usernameRef}
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.INPUT,
                                            borderColor: colors.INPUT_BORDER,
                                            color: colors.TEXT,
                                            fontSize: isTablet
                                                ? moderateScale(10)
                                                : moderateScale(13),
                                            height: verticalScale(44),
                                            paddingHorizontal: scale(24),
                                        },
                                    ]}
                                    placeholder='USERNAME'
                                    placeholderTextColor={colors.PLACEHOLDER}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize='words'
                                    autoCorrect={false}
                                    returnKeyType='next'
                                    onSubmitEditing={() => emailRef.current?.focus()}
                                />
                            )}
                        </>
                    )}

                    {/* Email Input */}
                    <ThemedInput
                        ref={emailRef}
                        placeholder='EMAIL'
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        autoCorrect={false}
                        returnKeyType={showForgotPassword ? 'done' : 'next'}
                        onSubmitEditing={() => {
                            if (showForgotPassword) {
                                handleForgotPassword();
                            } else {
                                passwordRef.current?.focus();
                            }
                        }}
                    />

                    {/* Password Input */}
                    {!showForgotPassword && (
                        <ThemedInput
                            ref={passwordRef}
                            placeholder='PASSWORD'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize='none'
                            autoCorrect={false}
                            returnKeyType='done'
                            onSubmitEditing={handleSubmit}
                        />
                    )}

                    {/* Age Verification & Contest Terms Checkboxes (Sign Up Only) */}
                    {!showForgotPassword && isSignUp && (
                        <View style={styles.checkboxContainer}>
                            {/* 18+ Age Verification */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setIsOver18(!isOver18)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        {
                                            borderColor: colors.INPUT_BORDER,
                                            backgroundColor: isOver18
                                                ? colors.BUTTON_COLOR
                                                : colors.INPUT,
                                        },
                                    ]}
                                >
                                    {isOver18 && (
                                        <Ionicons
                                            name='checkmark'
                                            size={scale(16)}
                                            color={colors.BUTTON_TEXT}
                                        />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.checkboxLabel,
                                        {
                                            color: colors.TEXT,
                                            fontSize: isTablet
                                                ? moderateScale(10)
                                                : moderateScale(12),
                                        },
                                    ]}
                                >
                                    I am 18 years of age or older
                                </Text>
                            </TouchableOpacity>

                            {/* Contest Terms Acceptance */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setAcceptedContestTerms(!acceptedContestTerms)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        {
                                            borderColor: colors.INPUT_BORDER,
                                            backgroundColor: acceptedContestTerms
                                                ? colors.BUTTON_COLOR
                                                : colors.INPUT,
                                        },
                                    ]}
                                >
                                    {acceptedContestTerms && (
                                        <Ionicons
                                            name='checkmark'
                                            size={scale(16)}
                                            color={colors.BUTTON_TEXT}
                                        />
                                    )}
                                </View>
                                <View style={styles.checkboxLabelContainer}>
                                    <Text
                                        style={[
                                            styles.checkboxLabel,
                                            {
                                                color: colors.TEXT,
                                                fontSize: isTablet
                                                    ? moderateScale(10)
                                                    : moderateScale(12),
                                            },
                                        ]}
                                    >
                                        I agree to the{' '}
                                        <Text
                                            style={[
                                                styles.linkTextInline,
                                                { color: colors.BUTTON_COLOR },
                                            ]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                Linking.openURL(
                                                    'https://hot-takes-18871.web.app/contest-rules.html'
                                                );
                                            }}
                                        >
                                            Contest Terms
                                        </Text>
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Main Action Button */}
                    <TouchableOpacity
                        style={[
                            styles.mainButton,
                            {
                                backgroundColor: colors.BUTTON_COLOR,
                                height: verticalScale(44),
                                marginTop: scale(8),
                            },
                        ]}
                        onPress={showForgotPassword ? handleForgotPassword : handleSubmit}
                        disabled={loading || authLoading}
                    >
                        {loading || authLoading ? (
                            <ActivityIndicator color={colors.BUTTON_TEXT} />
                        ) : (
                            <Text
                                style={[
                                    styles.mainButtonText,
                                    {
                                        color: colors.BUTTON_TEXT,
                                        fontSize: isTablet ? moderateScale(11) : moderateScale(14),
                                    },
                                ]}
                            >
                                {showForgotPassword
                                    ? 'SEND RESET LINK'
                                    : isSignUp
                                    ? 'SIGN UP'
                                    : 'LOGIN'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password Link */}
                    {!showForgotPassword && !isSignUp && (
                        <TouchableOpacity
                            onPress={toggleForgotPassword}
                            style={[styles.linkButton, { marginTop: scale(12) }]}
                        >
                            <Text
                                style={[
                                    styles.linkText,
                                    {
                                        color: colors.TEXT_SECONDARY,
                                        fontSize: isTablet ? moderateScale(10) : moderateScale(12),
                                    },
                                ]}
                            >
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Divider */}
                    {!showForgotPassword && (
                        <View
                            style={[
                                styles.dividerContainer,
                                { marginVertical: isTablet ? scale(12) : scale(16) },
                            ]}
                        >
                            <View style={[styles.divider, { backgroundColor: colors.DIVIDER }]} />
                        </View>
                    )}

                    {/* Toggle Sign Up/Sign In */}
                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            {
                                backgroundColor: colors.BUTTON_COLOR,
                                height: verticalScale(44),
                                marginTop: scale(8),
                            },
                        ]}
                        onPress={showForgotPassword ? toggleForgotPassword : toggleMode}
                    >
                        <Text
                            style={[
                                styles.secondaryButtonText,
                                {
                                    color: colors.BUTTON_TEXT,
                                    fontSize: isTablet ? moderateScale(11) : moderateScale(14),
                                },
                            ]}
                        >
                            {showForgotPassword
                                ? 'BACK TO SIGN IN'
                                : isSignUp
                                ? 'SIGN IN'
                                : 'CREATE ACCOUNT'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: isTablet ? scale(24) : scale(20),
        paddingTop: isTablet ? scale(40) : scale(60),
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: isTablet ? scale(20) : scale(28),
        marginTop: isTablet ? scale(20) : scale(30),
    },
    flameIcon: {
        width: isTablet ? scale(50) : scale(60),
        height: isTablet ? scale(50) : scale(60),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: scale(8),
    },
    flameEmoji: {
        // fontSize set dynamically
    },
    title: {
        fontWeight: 'bold',
    },
    errorContainer: {
        padding: scale(10),
        borderRadius: scale(8),
        marginBottom: scale(12),
    },
    errorText: {
        textAlign: 'center',
    },
    successContainer: {
        padding: scale(10),
        borderRadius: scale(8),
        marginBottom: scale(12),
    },
    successText: {
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        maxWidth: isTablet ? 600 : undefined,
        alignSelf: 'center',
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: scale(12),
        marginBottom: scale(8),
    },
    socialIconButton: {
        width: verticalScale(48),
        height: verticalScale(48),
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: scale(16),
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: scale(25),
        marginBottom: scale(10),
        fontWeight: '500',
    },
    mainButton: {
        borderRadius: scale(25),
        paddingHorizontal: scale(24),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    mainButtonText: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    linkButton: {
        alignItems: 'center',
    },
    linkText: {
        // fontSize set dynamically
    },
    secondaryButton: {
        borderRadius: scale(25),
        paddingHorizontal: scale(24),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    secondaryButtonText: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    checkboxContainer: {
        marginTop: scale(12),
        marginBottom: scale(8),
        gap: scale(12),
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: scale(10),
    },
    checkbox: {
        width: verticalScale(20),
        height: verticalScale(20),
        borderRadius: scale(4),
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: scale(2),
    },
    checkboxLabel: {
        flex: 1,
        lineHeight: scale(20),
    },
    checkboxLabelContainer: {
        flex: 1,
    },
    linkTextInline: {
        textDecorationLine: 'underline',
    },
});
