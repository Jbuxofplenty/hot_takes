import { useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface HotTakeCardProps {
    id: string;
    text: string;
    userDisplayName: string;
    totalScores: number;
    averageScore: number;
    userScore: number | null;
    rank?: number;
    totalInWeek?: number;
    isOwnTake?: boolean;
    onScoreSubmit?: (hotTakeId: string, score: number) => Promise<void>;
}

export default function HotTakeCard({
    id,
    text,
    userDisplayName,
    totalScores,
    averageScore,
    userScore,
    rank,
    totalInWeek,
    isOwnTake = false,
    onScoreSubmit,
}: HotTakeCardProps) {
    const { colors } = useTheme();
    const [localScore, setLocalScore] = useState<number>(userScore || 5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleScoreSubmit = async () => {
        if (isOwnTake) {
            Alert.alert('Cannot Score', "You can't score your own hot take!");
            return;
        }

        if (!onScoreSubmit) return;

        try {
            setIsSubmitting(true);
            await onScoreSubmit(id, Math.round(localScore));
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit score');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFireEmojis = (score: number): string => {
        const fireCount = Math.ceil(score / 2); // 1-2 = 🔥, 3-4 = 🔥🔥, etc.
        return '🔥'.repeat(Math.max(1, Math.min(5, fireCount)));
    };

    const hasScored = userScore !== null;

    return (
        <View style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND }]}>
            {/* Rank badge */}
            {rank && totalInWeek && (
                <View style={[styles.rankBadge, { backgroundColor: colors.PRIMARY }]}>
                    <Text style={styles.rankText}>
                        #{rank}/{totalInWeek}
                    </Text>
                </View>
            )}

            {/* Hot Take Text */}
            <Text style={[styles.text, { color: colors.TEXT }]}>{text}</Text>

            {/* Author */}
            <Text style={[styles.author, { color: colors.TEXT_SECONDARY }]}>
                — {userDisplayName}
            </Text>

            {/* Score Stats */}
            <View style={[styles.statsContainer, { borderTopColor: colors.DIVIDER }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.PRIMARY }]}>
                        {getFireEmojis(averageScore || 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.TEXT }]}>
                        {averageScore > 0 ? averageScore.toFixed(1) : '—'} avg
                    </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: colors.DIVIDER }]} />

                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.TEXT }]}>
                        {totalScores}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                        {totalScores === 1 ? 'score' : 'scores'}
                    </Text>
                </View>
            </View>

            {/* Scoring Section */}
            {!isOwnTake && (
                <View style={styles.scoringSection}>
                    <View style={styles.sliderContainer}>
                        <Text style={[styles.sliderLabel, { color: colors.TEXT_SECONDARY }]}>
                            Rate this take:
                        </Text>
                        <View style={styles.sliderRow}>
                            <Text style={[styles.scoreText, { color: colors.TEXT }]}>
                                {Math.round(localScore)}
                            </Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={1}
                                maximumValue={10}
                                step={1}
                                value={localScore}
                                onValueChange={setLocalScore}
                                minimumTrackTintColor={colors.PRIMARY}
                                maximumTrackTintColor={colors.DIVIDER}
                                thumbTintColor={colors.PRIMARY}
                                disabled={isSubmitting}
                            />
                            <Text style={[styles.fireEmoji, { color: colors.PRIMARY }]}>
                                {getFireEmojis(localScore)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: hasScored ? colors.TEXT_SECONDARY : colors.PRIMARY },
                            isSubmitting && styles.submitButtonDisabled,
                        ]}
                        onPress={handleScoreSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={[styles.submitButtonText, { color: colors.WHITE }]}>
                            {isSubmitting ? 'Submitting...' : hasScored ? 'Update Score' : 'Submit Score'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Own Take Indicator */}
            {isOwnTake && (
                <View style={[styles.ownTakeIndicator, { backgroundColor: colors.DIVIDER }]}>
                    <Ionicons name="person" size={moderateScale(16)} color={colors.TEXT_SECONDARY} />
                    <Text style={[styles.ownTakeText, { color: colors.TEXT_SECONDARY }]}>
                        Your Hot Take
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: scale(12),
        padding: scale(16),
        marginBottom: verticalScale(16),
        position: 'relative',
    },
    rankBadge: {
        position: 'absolute',
        top: scale(12),
        right: scale(12),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(6),
        borderRadius: scale(12),
    },
    rankText: {
        color: '#FFF',
        fontSize: moderateScale(12),
        fontWeight: 'bold',
    },
    text: {
        fontSize: moderateScale(16),
        lineHeight: moderateScale(24),
        marginBottom: verticalScale(8),
        paddingRight: scale(60), // Space for rank badge
    },
    author: {
        fontSize: moderateScale(13),
        fontStyle: 'italic',
        marginBottom: verticalScale(16),
    },
    statsContainer: {
        flexDirection: 'row',
        paddingTop: verticalScale(16),
        borderTopWidth: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
        marginBottom: verticalScale(4),
    },
    statLabel: {
        fontSize: moderateScale(12),
    },
    statDivider: {
        width: 1,
        marginHorizontal: scale(16),
    },
    scoringSection: {
        marginTop: verticalScale(16),
        gap: verticalScale(12),
    },
    sliderContainer: {
        gap: verticalScale(8),
    },
    sliderLabel: {
        fontSize: moderateScale(13),
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(12),
    },
    scoreText: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        width: scale(28),
    },
    slider: {
        flex: 1,
    },
    fireEmoji: {
        fontSize: moderateScale(20),
        width: scale(60),
    },
    submitButton: {
        paddingVertical: verticalScale(12),
        borderRadius: scale(8),
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    ownTakeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale(8),
        paddingVertical: verticalScale(8),
        marginTop: verticalScale(12),
        borderRadius: scale(8),
    },
    ownTakeText: {
        fontSize: moderateScale(13),
        fontWeight: '600',
    },
});

