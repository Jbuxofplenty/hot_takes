import { useTheme } from '@/contexts';
import { useFirebaseFunctions } from '@/hooks/use-firebase-functions';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface ReviewItem {
    id: string;
    text: string;
    userId: string;
    userDisplayName: string;
    maxToxicityProbability: number;
    toxicity: {
        label: string;
        match: boolean;
        probability: number;
    }[];
    flaggedAt: any;
}

export default function ReviewScreen({ onClose }: { onClose: () => void }) {
    const { colors } = useTheme();
    const { getPendingReviews, approveHotTake, rejectHotTake } = useFirebaseFunctions();
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

    const loadReviews = useCallback(async () => {
        try {
            const result = await getPendingReviews();
            setReviews(result.reviews as ReviewItem[]);
        } catch (error: any) {
            console.error('Error loading reviews:', error);
            Alert.alert('Error', error.message || 'Failed to load pending reviews');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getPendingReviews]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadReviews();
    };

    const handleApprove = async (reviewId: string) => {
        Alert.alert(
            'Approve Hot Take',
            'Are you sure you want to approve this hot take?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setProcessingId(reviewId);
                            await approveHotTake(reviewId);
                            setReviews((prev) => prev.filter((r) => r.id !== reviewId));
                            Alert.alert('Success', 'Hot take approved!');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to approve hot take');
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async (reviewId: string) => {
        if (!rejectReason.trim()) {
            Alert.alert('Reason Required', 'Please provide a reason for rejection');
            return;
        }

        try {
            setProcessingId(reviewId);
            await rejectHotTake(reviewId, rejectReason.trim());
            setReviews((prev) => prev.filter((r) => r.id !== reviewId));
            setShowRejectInput(null);
            setRejectReason('');
            Alert.alert('Success', 'Hot take rejected');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reject hot take');
        } finally {
            setProcessingId(null);
        }
    };

    const getFireEmojis = (score: number): string => {
        const fireCount = Math.ceil(score * 5); // 0.2 = 🔥, 0.4 = 🔥🔥, etc.
        return '🔥'.repeat(Math.max(1, Math.min(5, fireCount)));
    };

    const getToxicityColor = (probability: number): string => {
        if (probability >= 0.9) return '#FF0000'; // Red
        if (probability >= 0.7) return '#FF6B00'; // Orange
        if (probability >= 0.5) return '#FFB800'; // Yellow
        return colors.TEXT_SECONDARY;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name='arrow-back' size={moderateScale(24)} color={colors.TEXT} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: colors.ERROR }]}>
                        Content Review
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.TEXT }]}>
                        {reviews.length} pending
                    </Text>
                </View>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                    <Ionicons name='refresh' size={moderateScale(24)} color={colors.TEXT} />
                </TouchableOpacity>
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
                    {reviews.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>✅</Text>
                            <Text style={[styles.emptyText, { color: colors.TEXT }]}>
                                All clear!
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.TEXT_SECONDARY }]}>
                                No content pending review
                            </Text>
                        </View>
                    ) : (
                        reviews.map((review) => (
                            <View
                                key={review.id}
                                style={[
                                    styles.reviewCard,
                                    { backgroundColor: colors.CARD_BACKGROUND },
                                ]}
                            >
                                {/* Hot Take Text */}
                                <Text style={[styles.reviewText, { color: colors.TEXT }]}>
                                    {review.text}
                                </Text>

                                {/* Author */}
                                <Text style={[styles.author, { color: colors.TEXT_SECONDARY }]}>
                                    — {review.userDisplayName}
                                </Text>

                                {/* Toxicity Score */}
                                <View
                                    style={[
                                        styles.toxicityBadge,
                                        {
                                            backgroundColor: getToxicityColor(
                                                review.maxToxicityProbability
                                            ),
                                        },
                                    ]}
                                >
                                    <Text style={styles.toxicityText}>
                                        {getFireEmojis(review.maxToxicityProbability)}{' '}
                                        {Math.round(review.maxToxicityProbability * 100)}% Toxicity
                                    </Text>
                                </View>

                                {/* Toxicity Details */}
                                <View style={styles.toxicityDetails}>
                                    <Text
                                        style={[
                                            styles.detailsTitle,
                                            { color: colors.TEXT_SECONDARY },
                                        ]}
                                    >
                                        Detected Categories:
                                    </Text>
                                    {review.toxicity
                                        .filter((t) => t.match)
                                        .map((t, idx) => (
                                            <View key={idx} style={styles.categoryRow}>
                                                <Text
                                                    style={[
                                                        styles.categoryLabel,
                                                        { color: colors.TEXT },
                                                    ]}
                                                >
                                                    • {t.label}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.categoryProb,
                                                        {
                                                            color: getToxicityColor(t.probability),
                                                        },
                                                    ]}
                                                >
                                                    {Math.round(t.probability * 100)}%
                                                </Text>
                                            </View>
                                        ))}
                                    {review.toxicity.filter((t) => t.match).length === 0 && (
                                        <Text
                                            style={[
                                                styles.noCategories,
                                                { color: colors.TEXT_SECONDARY },
                                            ]}
                                        >
                                            High probability but no specific matches
                                        </Text>
                                    )}
                                </View>

                                {/* Rejection Reason Input */}
                                {showRejectInput === review.id && (
                                    <View style={styles.rejectInputContainer}>
                                        <TextInput
                                            style={[
                                                styles.rejectInput,
                                                {
                                                    backgroundColor: colors.INPUT,
                                                    color: colors.TEXT,
                                                },
                                            ]}
                                            placeholder='Reason for rejection...'
                                            placeholderTextColor={colors.PLACEHOLDER}
                                            value={rejectReason}
                                            onChangeText={setRejectReason}
                                            multiline
                                        />
                                    </View>
                                )}

                                {/* Action Buttons */}
                                <View style={styles.actionButtons}>
                                    {showRejectInput === review.id ? (
                                        <>
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    styles.cancelButton,
                                                    { backgroundColor: colors.DIVIDER },
                                                ]}
                                                onPress={() => {
                                                    setShowRejectInput(null);
                                                    setRejectReason('');
                                                }}
                                                disabled={processingId === review.id}
                                            >
                                                <Text
                                                    style={[
                                                        styles.actionButtonText,
                                                        { color: colors.TEXT },
                                                    ]}
                                                >
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    styles.confirmRejectButton,
                                                    { backgroundColor: '#FF0000' },
                                                ]}
                                                onPress={() => handleReject(review.id)}
                                                disabled={
                                                    processingId === review.id ||
                                                    !rejectReason.trim()
                                                }
                                            >
                                                {processingId === review.id ? (
                                                    <ActivityIndicator color='#FFF' />
                                                ) : (
                                                    <Text style={styles.actionButtonText}>
                                                        Confirm Reject
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    styles.rejectButton,
                                                    { backgroundColor: '#FF6B6B' },
                                                ]}
                                                onPress={() => setShowRejectInput(review.id)}
                                                disabled={processingId === review.id}
                                            >
                                                <Ionicons
                                                    name='close-circle'
                                                    size={moderateScale(20)}
                                                    color='#FFF'
                                                />
                                                <Text style={styles.actionButtonText}>Reject</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    styles.approveButton,
                                                    { backgroundColor: '#4CAF50' },
                                                ]}
                                                onPress={() => handleApprove(review.id)}
                                                disabled={processingId === review.id}
                                            >
                                                {processingId === review.id ? (
                                                    <ActivityIndicator color='#FFF' />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name='checkmark-circle'
                                                            size={moderateScale(20)}
                                                            color='#FFF'
                                                        />
                                                        <Text style={styles.actionButtonText}>
                                                            Approve
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>
                        ))
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
    refreshButton: {
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
    reviewCard: {
        borderRadius: scale(12),
        padding: scale(16),
        marginBottom: verticalScale(16),
    },
    reviewText: {
        fontSize: moderateScale(16),
        lineHeight: moderateScale(24),
        marginBottom: verticalScale(8),
    },
    author: {
        fontSize: moderateScale(13),
        fontStyle: 'italic',
        marginBottom: verticalScale(12),
    },
    toxicityBadge: {
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(8),
        borderRadius: scale(8),
        alignSelf: 'flex-start',
        marginBottom: verticalScale(12),
    },
    toxicityText: {
        color: '#FFF',
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
    toxicityDetails: {
        marginBottom: verticalScale(16),
    },
    detailsTitle: {
        fontSize: moderateScale(12),
        fontWeight: '600',
        marginBottom: verticalScale(8),
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: verticalScale(4),
    },
    categoryLabel: {
        fontSize: moderateScale(13),
    },
    categoryProb: {
        fontSize: moderateScale(13),
        fontWeight: '600',
    },
    noCategories: {
        fontSize: moderateScale(12),
        fontStyle: 'italic',
    },
    rejectInputContainer: {
        marginBottom: verticalScale(12),
    },
    rejectInput: {
        borderRadius: scale(8),
        padding: scale(12),
        fontSize: moderateScale(14),
        minHeight: verticalScale(80),
        textAlignVertical: 'top',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: scale(12),
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(12),
        borderRadius: scale(8),
        gap: scale(6),
    },
    rejectButton: {},
    approveButton: {},
    cancelButton: {},
    confirmRejectButton: {},
    actionButtonText: {
        color: '#FFF',
        fontSize: moderateScale(14),
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
    },
});

