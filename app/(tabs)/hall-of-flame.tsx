import { useAuth, useTheme } from '@/contexts';
import { useFirebaseFunctions } from '@/hooks/use-firebase-functions';
import HotTakeCard from '@/components/HotTakeCard';
import LoginScreen from '@/screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface HotTakeFeed {
    id: string;
    text: string;
    userId: string;
    userDisplayName: string;
    createdAt: number;
    totalScores: number;
    averageScore: number;
    userScore: number | null;
    rank?: number;
}

export default function HallOfFlameScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { getTopHotTakes, scoreHotTake } = useFirebaseFunctions();
    const [hotTakes, setHotTakes] = useState<HotTakeFeed[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastId, setLastId] = useState<string | null>(null);

    const loadTopTakes = useCallback(
        async (refresh = false) => {
            try {
                if (refresh) {
                    setRefreshing(true);
                    setLastId(null);
                }

                const result = await getTopHotTakes(20, refresh ? undefined : lastId || undefined);

                if (refresh) {
                    setHotTakes(result.hotTakes);
                } else {
                    setHotTakes((prev) => [...prev, ...result.hotTakes]);
                }

                setHasMore(result.hasMore);
                setLastId(result.lastId);
            } catch (error) {
                console.error('Error loading top hot takes:', error);
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        },
        [getTopHotTakes, lastId]
    );

    useEffect(() => {
        if (user) {
            loadTopTakes(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleScoreSubmit = async (hotTakeId: string, score: number) => {
        await scoreHotTake(hotTakeId, score);
        // Reload to get updated stats
        loadTopTakes(true);
    };

    const handleRefresh = () => {
        loadTopTakes(true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !refreshing) {
            setLoadingMore(true);
            loadTopTakes(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>
                🏆 All-Time Top Takes
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.TEXT_SECONDARY }]}>
                Highest scored hot takes ever
            </Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size='small' color={colors.PRIMARY} />
                <Text style={[styles.footerText, { color: colors.TEXT_SECONDARY }]}>
                    Loading more...
                </Text>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={[styles.emptyText, { color: colors.TEXT }]}>
                No scored hot takes yet!
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.TEXT_SECONDARY }]}>
                Be the first to score some takes
            </Text>
        </View>
    );

    if (!user) {
        return <LoginScreen />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.ERROR }]}>
                        Hall of Flame
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.TEXT }]}>
                        Top Hot Takes
                    </Text>
                </View>
                <Ionicons name='trophy' size={moderateScale(28)} color={colors.PRIMARY} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size='large' color={colors.PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={hotTakes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <HotTakeCard
                            {...item}
                            isOwnTake={item.userId === user.uid}
                            onScoreSubmit={handleScoreSubmit}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                />
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
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: moderateScale(16),
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: scale(16),
        paddingBottom: verticalScale(32),
    },
    headerSection: {
        marginBottom: verticalScale(20),
    },
    sectionTitle: {
        fontSize: moderateScale(24),
        fontWeight: 'bold',
        marginBottom: verticalScale(4),
    },
    sectionSubtitle: {
        fontSize: moderateScale(14),
    },
    footerLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(20),
        gap: scale(8),
    },
    footerText: {
        fontSize: moderateScale(13),
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
