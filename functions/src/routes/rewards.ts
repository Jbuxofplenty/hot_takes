import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { getAppCheckConfig } from '../utils/appCheckConfig';
import { getActivePlayerCount } from '../utils/presenceSystem';

const db = getFirestore();

/**
 * Reward tiers configuration
 * Define the reward amounts based on active player count
 */
const REWARD_TIERS = [
    { minPlayers: 0, maxPlayers: 99, reward: 10 },
    { minPlayers: 100, maxPlayers: 199, reward: 15 },
    { minPlayers: 200, maxPlayers: 299, reward: 20 },
    { minPlayers: 300, maxPlayers: 499, reward: 25 },
    { minPlayers: 500, maxPlayers: 999, reward: 50 },
    { minPlayers: 1000, maxPlayers: 1999, reward: 75 },
    { minPlayers: 2000, maxPlayers: 4999, reward: 100 },
    { minPlayers: 5000, maxPlayers: 9999, reward: 150 },
    { minPlayers: 10000, maxPlayers: Infinity, reward: 200 },
];

/**
 * Get current reward tier based on active player count
 */
function getRewardTier(activePlayerCount: number) {
    const currentTier = REWARD_TIERS.find(
        (tier) => activePlayerCount >= tier.minPlayers && activePlayerCount <= tier.maxPlayers
    );

    const currentTierIndex = REWARD_TIERS.indexOf(currentTier!);
    const nextTier =
        currentTierIndex < REWARD_TIERS.length - 1 ? REWARD_TIERS[currentTierIndex + 1] : null;

    return {
        currentTier: currentTier!,
        nextTier,
        playersUntilNextTier: nextTier ? nextTier.minPlayers - activePlayerCount : 0,
    };
}

/**
 * Handler to get current rewards information
 */
export async function getRewardsInfoHandler(_request: any) {
    // Get active player count from Firestore
    const activePlayerCount = await getActivePlayerCount();

    // Get reward tier info
    const { currentTier, nextTier, playersUntilNextTier } = getRewardTier(activePlayerCount);

    // Get reward stats from Firestore
    const rewardStatsDoc = await db.collection('stats').doc('rewards').get();
    const rewardStats = rewardStatsDoc.data() || {
        totalPaidOut: 0,
        weeklyWinners: [],
        lastWeekWinner: null,
    };

    return {
        success: true,
        data: {
            currentReward: currentTier.reward,
            activePlayerCount,
            nextReward: nextTier?.reward || null,
            playersUntilNextTier,
            rewardStats,
        },
    };
}

/**
 * Get rewards information
 */
export const getRewardsInfo = onCall(getAppCheckConfig(), getRewardsInfoHandler);
