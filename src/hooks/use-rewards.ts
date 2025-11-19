import {useEffect, useState} from 'react';
import {collection, onSnapshot, query, where} from 'firebase/firestore';
import {db} from '@/config/firebase';
import {useFirebaseFunctions} from './use-firebase-functions';

interface RewardTier {
    minPlayers: number;
    maxPlayers: number;
    reward: number;
}

interface RewardsData {
    currentReward: number;
    activePlayerCount: number;
    nextReward: number | null;
    playersUntilNextTier: number;
    rewardStats: {
        totalPaidOut: number;
        weeklyWinners: any[];
        lastWeekWinner: any;
    };
}

/**
 * Hook to get real-time rewards information
 * Listens to the presence collection for active player count updates
 * and calculates rewards in real-time
 */
export function useRewards() {
    const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {getRewardsInfo} = useFirebaseFunctions();

    useEffect(() => {
        // Set up real-time listener for active players
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const presenceQuery = query(
            collection(db, 'presence'),
            where('online', '==', true),
            where('lastSeen', '>', fiveMinutesAgo)
        );

        const unsubscribe = onSnapshot(
            presenceQuery,
            async (snapshot) => {
                try {
                    // Get the active player count from the snapshot
                    const activePlayerCount = snapshot.size;

                    // Fetch the complete rewards data from the backend
                    // This includes reward tiers and stats
                    const result = await getRewardsInfo();

                    // Override the active player count with our real-time count
                    setRewardsData({
                        ...result.data,
                        activePlayerCount,
                    });
                    setLoading(false);
                    setError(null);
                } catch (err) {
                    console.error('Error fetching rewards info:', err);
                    setError('Failed to load rewards information');
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Error listening to presence:', err);
                setError('Failed to connect to presence system');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [getRewardsInfo]);

    return {rewardsData, loading, error};
}

