import { useAuth, useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function ProfileScreen() {
    const { colors } = useTheme();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            // Navigation will be handled automatically by the tab layout
        } catch (error) {
            console.error('Logout error:', error);
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

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.CARD_BACKGROUND }]}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.TEXT }]}>
                            My Hot Takes
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.CARD_BACKGROUND }]}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.TEXT }]}>
                            Settings
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.CARD_BACKGROUND }]}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.TEXT }]}>
                            Help & Support
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: colors.ERROR }]}
                        onPress={handleLogout}
                    >
                        <Text style={[styles.logoutButtonText, { color: colors.WHITE }]}>
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
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
