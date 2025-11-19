import { useAuth, useTheme } from '@/contexts';
import { useFirebaseFunctions } from '@/hooks/use-firebase-functions';
import LoginScreen from '@/screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function TakeCreationScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { submitHotTake } = useFirebaseFunctions();
    const [takeText, setTakeText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const maxChars = 150;

    // If not authenticated, show login screen
    if (!user) {
        return <LoginScreen />;
    }

    const handleSubmit = async () => {
        if (!takeText.trim()) {
            Alert.alert('Empty Take', 'Please enter your hot take before submitting.');
            return;
        }

        if (takeText.trim().length > maxChars) {
            Alert.alert('Too Long', `Your hot take must be ${maxChars} characters or less.`);
            return;
        }

        // Dismiss keyboard before submitting
        Keyboard.dismiss();
        setIsSubmitting(true);

        try {
            const response = await submitHotTake(takeText.trim());

            if (response.success) {
                const message =
                    response.status === 'approved'
                        ? 'Your hot take is live! Check it out in the Wall of Flame. 🔥'
                        : 'Your hot take is being reviewed for content policy. You\'ll be notified once approved!';

                Alert.alert('Hot Take Submitted! 🔥', message, [
                    {
                        text: 'OK',
                        onPress: () => setTakeText(''), // Clear the input
                    },
                ]);
            }
        } catch (error: any) {
            console.error('Error submitting hot take:', error);
            Alert.alert(
                'Submission Failed',
                error.message || 'Failed to submit your hot take. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
                        <Text style={[styles.headerTitle, { color: colors.ERROR }]}>Hot Takes</Text>
                        <Ionicons name='flame' size={moderateScale(28)} color={colors.PRIMARY} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={[styles.instruction, { color: colors.TEXT }]}>
                            GIVE US YOUR HOT TAKE
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: colors.INPUT }]}>
                            <TextInput
                                style={[styles.textInput, { color: colors.TEXT }]}
                                placeholder='Technology gave us godlike reach and toddler-like restraint'
                                placeholderTextColor={colors.PLACEHOLDER}
                                multiline
                                maxLength={maxChars}
                                value={takeText}
                                onChangeText={setTakeText}
                                textAlignVertical='top'
                                returnKeyType="done"
                                blurOnSubmit={true}
                            />
                            <Text style={[styles.charCount, { color: colors.TEXT_SECONDARY }]}>
                                {takeText.length}/{maxChars} Characters Used
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: colors.BUTTON_COLOR },
                                (isSubmitting || !takeText.trim()) && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !takeText.trim()}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={colors.BUTTON_TEXT} />
                            ) : (
                                <Text style={[styles.submitButtonText, { color: colors.BUTTON_TEXT }]}>
                                    SUBMIT
                                </Text>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.disclaimer, { color: colors.TEXT_SECONDARY }]}>
                            *NO HATE SPEECH OR ILLEGAL CONTENT
                        </Text>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(60),
        paddingBottom: verticalScale(16),
        borderBottomWidth: 2,
    },
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: scale(20),
    },
    instruction: {
        fontSize: moderateScale(11),
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: verticalScale(16),
    },
    inputContainer: {
        borderRadius: scale(12),
        padding: scale(16),
        minHeight: verticalScale(200),
        marginBottom: verticalScale(20),
    },
    textInput: {
        flex: 1,
        fontSize: moderateScale(16),
        lineHeight: moderateScale(24),
    },
    charCount: {
        fontSize: moderateScale(12),
        marginTop: verticalScale(8),
    },
    submitButton: {
        paddingVertical: verticalScale(16),
        borderRadius: scale(25),
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: moderateScale(16),
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    disclaimer: {
        fontSize: moderateScale(11),
        textAlign: 'center',
    },
});
