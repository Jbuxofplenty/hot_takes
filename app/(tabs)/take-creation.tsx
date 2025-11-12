import { useAuth, useTheme } from '@/contexts';
import LoginScreen from '@/screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function TakeCreationScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [takeText, setTakeText] = useState('');
    const maxChars = 150;

    // If not authenticated, show login screen
    if (!user) {
        return <LoginScreen />;
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                    />
                    <Text style={[styles.charCount, { color: colors.TEXT_SECONDARY }]}>
                        {takeText.length}/{maxChars} Characters Used
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.BUTTON_COLOR }]}
                >
                    <Text style={[styles.submitButtonText, { color: colors.BUTTON_TEXT }]}>
                        SUBMIT
                    </Text>
                </TouchableOpacity>

                <Text style={[styles.disclaimer, { color: colors.TEXT_SECONDARY }]}>
                    *NO HATE SPEECH OR ILLEGAL CONTENT
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
