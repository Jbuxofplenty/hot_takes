import { useAuth, useTheme } from '@/contexts';
import { useFirebaseFunctions } from '@/hooks/use-firebase-functions';
import HotTakeCard from '@/components/HotTakeCard';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface HotTake {
    id: string;
    text: string;
    userId: string;
    userDisplayName: string;
    status: string;
    createdAt: any;
    totalScores?: number;
    averageScore?: number;
}

export default function MyHotTakesScreen({ onClose }: { onClose: () => void }) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { getMyHotTakes } = useFirebaseFunctions();
    const [hotTakes, setHotTakes] = useState<HotTake[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMyTakes = useCallback(async () => {
        if (!user) return;

        try {
            const result = await getMyHotTakes(50);
            setHotTakes(result.hotTakes as HotTake[]);
        } catch (error) {
            console.error('Error loading my hot takes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, getMyHotTakes]);

    useEffect(() => {
        loadMyTakes();
    }, [loadMyTakes]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadMyTakes();
    };

    const approvedTakes = hotTakes.filter((take) => take.status === 'approved');
    const pendingTakes = hotTakes.filter(
        (take) => take.status === 'analyzing' || take.status === 'pending_review'
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name='arrow-back' size={moderateScale(24)} color={colors.TEXT} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: colors.ERROR }]}>
                        My Hot Takes
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.TEXT }]}>
                        {hotTakes.length} total
                    </Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size='large' color={colors.PRIMARY} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.PRIMARY}
                        />
                    }
                >
                    {/* Approved Takes */}
                    {approvedTakes.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>
                                    ✅ Live Takes
                                </Text>
                                <Text style={[styles.sectionCount, { color: colors.TEXT_SECONDARY }]}>
                                    {approvedTakes.length}
                                </Text>
                            </View>

                            {approvedTakes.map((take) => (
                                <HotTakeCard
                                    key={take.id}
                                    id={take.id}
                                    text={take.text}
                                    userDisplayName={take.userDisplayName}
                                    totalScores={take.totalScores || 0}
                                    averageScore={take.averageScore || 0}
                                    userScore={null}
                                    isOwnTake={true}
                                />
                            ))}
                        </View>
                    )}

                    {/* Pending Takes */}
                    {pendingTakes.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>
                                    ⏳ Under Review
                                </Text>
                                <Text style={[styles.sectionCount, { color: colors.TEXT_SECONDARY }]}>
                                    {pendingTakes.length}
                                </Text>
                            </View>

                            {pendingTakes.map((take) => (
                                <View
                                    key={take.id}
                                    style={[
                                        styles.pendingCard,
                                        { backgroundColor: colors.CARD_BACKGROUND },
                                    ]}
                                >
                                    <Text style={[styles.pendingText, { color: colors.TEXT }]}>
                                        {take.text}
                                    </Text>
                                    <View style={[styles.pendingBadge, { backgroundColor: colors.DIVIDER }]}>
                                        <Ionicons
                                            name='time-outline'
                                            size={moderateScale(14)}
                                            color={colors.TEXT_SECONDARY}
                                        />
                                        <Text
                                            style={[
                                                styles.pendingBadgeText,
                                                { color: colors.TEXT_SECONDARY },
                                            ]}
                                        >
                                            Pending review
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Empty State */}
                    {hotTakes.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>🔥</Text>
                            <Text style={[styles.emptyText, { color: colors.TEXT }]}>
                                No hot takes yet!
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.TEXT_SECONDARY }]}>
                                Go to the flame tab to submit your first one
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
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
    backButton: {
        padding: scale(8),
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    placeholder: {
        width: scale(40),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: scale(16),
    },
    section: {
        marginBottom: verticalScale(24),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    sectionTitle: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
    },
    sectionCount: {
        fontSize: moderateScale(14),
    },
    pendingCard: {
        borderRadius: scale(12),
        padding: scale(16),
        marginBottom: verticalScale(12),
    },
    pendingText: {
        fontSize: moderateScale(16),
        lineHeight: moderateScale(24),
        marginBottom: verticalScale(12),
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(6),
        borderRadius: scale(12),
        alignSelf: 'flex-start',
    },
    pendingBadgeText: {
        fontSize: moderateScale(12),
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(80),
    },
    emptyEmoji: {
        fontSize: moderateScale(64),
        marginBottom: verticalScale(16),
    },
    emptyText: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        marginBottom: verticalScale(8),
    },
    emptySubtext: {
        fontSize: moderateScale(14),
        textAlign: 'center',
    },
});

