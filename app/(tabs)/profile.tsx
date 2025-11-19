import { useAuth, useTheme } from '@/contexts';
import { useFirebaseFunctions } from '@/hooks/use-firebase-functions';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function ProfileScreen() {
    const { colors, setThemePreference, themePreference } = useTheme();
    const { user, logout } = useAuth();
    const { getUserSettings, updateUserSettings } = useFirebaseFunctions();
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load settings on mount
    const loadSettings = useCallback(async () => {
        if (!user) return;

        try {
            const result = await getUserSettings();
            setIsAnonymous(result.settings.isAnonymous);
        } catch (error) {
            console.error('Error loading settings:', error);
            // Silently fail - use default values
        }
    }, [user, getUserSettings]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleLogout = async () => {
        try {
            await logout();
            // Navigation will be handled automatically by the tab layout
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleAnonymousToggle = async (value: boolean) => {
        setIsAnonymous(value);

        try {
            setSaving(true);
            await updateUserSettings({ isAnonymous: value });
        } catch (error) {
            console.error('Error saving anonymous setting:', error);
            // Revert on error
            setIsAnonymous(!value);
        } finally {
            setSaving(false);
        }
    };

    const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
        setThemePreference(theme);

        try {
            setSaving(true);
            await updateUserSettings({ theme });
        } catch (error) {
            console.error('Error saving theme:', error);
            // Note: Don't revert theme preference as it's already changed in context
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.ERROR }]}>Profile</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.TEXT }]}>Hot Takes</Text>
                </View>
                <Ionicons name='person-outline' size={moderateScale(28)} color={colors.PRIMARY} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Info */}
                <View style={[styles.userCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
                    <Text style={[styles.userEmoji]}>🔥</Text>
                    <Text style={[styles.userName, { color: colors.TEXT }]}>
                        {user?.displayName || 'Hot Takes User'}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.TEXT_SECONDARY }]}>
                        {user?.email}
                    </Text>
                </View>

                {/* Stats */}
                <View style={[styles.statsContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.TEXT }]}>0</Text>
                        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                            Hot Takes Submitted
                        </Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.DIVIDER }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.TEXT }]}>0</Text>
                        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                            Total Heat Score
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.CARD_BACKGROUND }]}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.TEXT }]}>
                            My Hot Takes
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Settings</Text>

                    {/* Anonymous Posting Toggle */}
                    <View style={[styles.settingCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingLabel, { color: colors.TEXT }]}>
                                    Post Anonymously
                                </Text>
                                <Text
                                    style={[
                                        styles.settingDescription,
                                        { color: colors.TEXT_SECONDARY },
                                    ]}
                                >
                                    Hide your username on Hot Takes
                                </Text>
                            </View>
                            <Switch
                                value={isAnonymous}
                                onValueChange={handleAnonymousToggle}
                                trackColor={{ false: colors.DIVIDER, true: colors.PRIMARY }}
                                thumbColor={colors.WHITE}
                                disabled={saving}
                            />
                        </View>
                    </View>

                    {/* Theme Selection */}
                    <View style={[styles.settingCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
                        <Text
                            style={[
                                styles.settingLabel,
                                { color: colors.TEXT, marginBottom: verticalScale(12) },
                            ]}
                        >
                            Appearance
                        </Text>
                        <ThemeOption
                            label='Light'
                            description='Always use light theme'
                            selected={themePreference === 'light'}
                            onSelect={() => handleThemeChange('light')}
                            colors={colors}
                            disabled={saving}
                        />
                        <ThemeOption
                            label='Dark'
                            description='Always use dark theme'
                            selected={themePreference === 'dark'}
                            onSelect={() => handleThemeChange('dark')}
                            colors={colors}
                            disabled={saving}
                        />
                        <ThemeOption
                            label='Auto'
                            description='Match system theme'
                            selected={themePreference === 'auto'}
                            onSelect={() => handleThemeChange('auto')}
                            colors={colors}
                            disabled={saving}
                            last
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.ERROR }]}
                    onPress={handleLogout}
                >
                    <Text style={[styles.logoutButtonText, { color: colors.WHITE }]}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

interface ThemeOptionProps {
    label: string;
    description: string;
    selected: boolean;
    onSelect: () => void;
    colors: any;
    disabled?: boolean;
    last?: boolean;
}

function ThemeOption({
    label,
    description,
    selected,
    onSelect,
    colors,
    disabled = false,
    last = false,
}: ThemeOptionProps) {
    return (
        <TouchableOpacity
            onPress={onSelect}
            disabled={disabled}
            style={[
                styles.themeOption,
                { borderBottomColor: colors.DIVIDER },
                last && styles.themeOptionLast,
            ]}
        >
            <View style={styles.themeOptionContent}>
                <Text
                    style={[
                        styles.themeOptionLabel,
                        { color: colors.TEXT },
                        selected && styles.themeOptionLabelBold,
                    ]}
                >
                    {label}
                </Text>
                <Text style={[styles.themeOptionDescription, { color: colors.TEXT_SECONDARY }]}>
                    {description}
                </Text>
            </View>
            {selected && (
                <View style={[styles.checkmark, { backgroundColor: colors.PRIMARY }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                </View>
            )}
        </TouchableOpacity>
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
    headerSubtitle: {
        fontSize: moderateScale(16),
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: scale(20),
    },
    userCard: {
        alignItems: 'center',
        padding: scale(24),
        borderRadius: scale(12),
        marginBottom: verticalScale(20),
    },
    userEmoji: {
        fontSize: moderateScale(64),
        marginBottom: verticalScale(12),
    },
    userName: {
        fontSize: moderateScale(24),
        fontWeight: 'bold',
        marginBottom: verticalScale(8),
    },
    userEmail: {
        fontSize: moderateScale(14),
    },
    statsContainer: {
        flexDirection: 'row',
        padding: scale(20),
        borderRadius: scale(12),
        marginBottom: verticalScale(20),
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: moderateScale(32),
        fontWeight: 'bold',
        marginBottom: verticalScale(4),
    },
    statLabel: {
        fontSize: moderateScale(12),
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        marginHorizontal: scale(16),
    },
    actionsContainer: {
        gap: scale(12),
        marginBottom: verticalScale(24),
    },
    actionButton: {
        paddingVertical: verticalScale(16),
        paddingHorizontal: scale(20),
        borderRadius: scale(12),
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: moderateScale(16),
        fontWeight: '600',
    },
    settingsSection: {
        marginTop: verticalScale(8),
    },
    sectionTitle: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
        marginBottom: verticalScale(12),
    },
    settingCard: {
        padding: scale(20),
        borderRadius: scale(12),
        marginBottom: verticalScale(12),
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingInfo: {
        flex: 1,
        marginRight: scale(16),
    },
    settingLabel: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        marginBottom: verticalScale(4),
    },
    settingDescription: {
        fontSize: moderateScale(13),
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(16),
        borderBottomWidth: 1,
    },
    themeOptionLast: {
        borderBottomWidth: 0,
    },
    themeOptionContent: {
        flex: 1,
    },
    themeOptionLabel: {
        fontSize: moderateScale(16),
        marginBottom: verticalScale(4),
    },
    themeOptionLabelBold: {
        fontWeight: '600',
    },
    themeOptionDescription: {
        fontSize: moderateScale(13),
    },
    checkmark: {
        width: scale(24),
        height: scale(24),
        borderRadius: scale(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        fontSize: moderateScale(16),
        color: '#fff',
        fontWeight: 'bold',
    },
    logoutButton: {
        paddingVertical: verticalScale(16),
        paddingHorizontal: scale(20),
        borderRadius: scale(12),
        alignItems: 'center',
        marginTop: verticalScale(20),
        marginBottom: verticalScale(40),
    },
    logoutButtonText: {
        fontSize: moderateScale(16),
        fontWeight: 'bold',
    },
});
