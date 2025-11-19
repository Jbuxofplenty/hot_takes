import { httpsCallable } from 'firebase/functions';
import { useCallback } from 'react';
import { functions } from '../config/firebase';

interface UserSettings {
    theme: 'light' | 'dark' | 'auto';
    isAnonymous: boolean;
    updatedAt?: string;
}

interface GetUserSettingsResponse {
    success: boolean;
    settings: UserSettings;
}

interface UpdateUserSettingsResponse {
    success: boolean;
    message: string;
    settings: UserSettings;
}

interface ResetUserSettingsResponse {
    success: boolean;
    message: string;
    settings: UserSettings;
}

interface GetRewardsInfoResponse {
    success: boolean;
    data: {
        currentReward: number;
        activePlayerCount: number;
        nextReward: number | null;
        playersUntilNextTier: number;
        rewardStats: {
            totalPaidOut: number;
            weeklyWinners: any[];
            lastWeekWinner: any;
        };
    };
}

interface SubmitHotTakeResponse {
    success: boolean;
    hotTakeId: string;
    message: string;
    status?: 'approved' | 'pending_review';
}

interface HotTake {
    id: string;
    text: string;
    userId: string;
    userDisplayName: string;
    status: string;
    createdAt: any;
    likes: number;
    flames: number;
    toxicity?: {
        label: string;
        match: boolean;
        probability: number;
    }[];
}

interface GetHotTakesResponse {
    success: boolean;
    hotTakes: HotTake[];
    hasMore: boolean;
}

interface GetMyHotTakesResponse {
    success: boolean;
    hotTakes: HotTake[];
    hasMore: boolean;
}

interface ApproveHotTakeResponse {
    success: boolean;
    message: string;
}

interface RejectHotTakeResponse {
    success: boolean;
    message: string;
}

interface GetPendingReviewsResponse {
    success: boolean;
    reviews: HotTake[];
    count: number;
}

interface ScoreHotTakeResponse {
    success: boolean;
    message: string;
    totalScores: number;
    averageScore: number;
}

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
    totalInWeek?: number;
}

interface GetHotTakesFeedResponse {
    success: boolean;
    currentWeek: HotTakeFeed[];
    previousWeeks: HotTakeFeed[];
    totalTakes: number;
}

interface GetTopHotTakesResponse {
    success: boolean;
    hotTakes: HotTakeFeed[];
    hasMore: boolean;
    lastId: string | null;
}

export function useFirebaseFunctions() {
    const getUserSettings = useCallback(async (): Promise<GetUserSettingsResponse> => {
        const callable = httpsCallable<void, GetUserSettingsResponse>(functions, 'getUserSettings');
        const result = await callable();
        return result.data;
    }, []);

    const updateUserSettings = useCallback(
        async (settings: Partial<UserSettings>): Promise<UpdateUserSettingsResponse> => {
            const callable = httpsCallable<
                { settings: Partial<UserSettings> },
                UpdateUserSettingsResponse
            >(functions, 'updateUserSettings');
            const result = await callable({ settings });
            return result.data;
        },
        []
    );

    const resetUserSettings = useCallback(async (): Promise<ResetUserSettingsResponse> => {
        const callable = httpsCallable<void, ResetUserSettingsResponse>(
            functions,
            'resetUserSettings'
        );
        const result = await callable();
        return result.data;
    }, []);

    const getRewardsInfo = useCallback(async (): Promise<GetRewardsInfoResponse> => {
        const callable = httpsCallable<void, GetRewardsInfoResponse>(functions, 'getRewardsInfo');
        const result = await callable();
        return result.data;
    }, []);

    const submitHotTake = useCallback(async (text: string): Promise<SubmitHotTakeResponse> => {
        const callable = httpsCallable<{ text: string }, SubmitHotTakeResponse>(
            functions,
            'submitHotTake'
        );
        const result = await callable({ text });
        return result.data;
    }, []);

    const getHotTakes = useCallback(
        async (limit = 20, startAfter?: string): Promise<GetHotTakesResponse> => {
            const callable = httpsCallable<
                { limit: number; startAfter?: string },
                GetHotTakesResponse
            >(functions, 'getHotTakes');
            const result = await callable({ limit, startAfter });
            return result.data;
        },
        []
    );

    const getMyHotTakes = useCallback(
        async (limit = 20, startAfter?: string): Promise<GetMyHotTakesResponse> => {
            const callable = httpsCallable<
                { limit: number; startAfter?: string },
                GetMyHotTakesResponse
            >(functions, 'getMyHotTakes');
            const result = await callable({ limit, startAfter });
            return result.data;
        },
        []
    );

    const approveHotTake = useCallback(
        async (hotTakeId: string): Promise<ApproveHotTakeResponse> => {
            const callable = httpsCallable<{ hotTakeId: string }, ApproveHotTakeResponse>(
                functions,
                'approveHotTake'
            );
            const result = await callable({ hotTakeId });
            return result.data;
        },
        []
    );

    const rejectHotTake = useCallback(
        async (hotTakeId: string, reason?: string): Promise<RejectHotTakeResponse> => {
            const callable = httpsCallable<
                { hotTakeId: string; reason?: string },
                RejectHotTakeResponse
            >(functions, 'rejectHotTake');
            const result = await callable({ hotTakeId, reason });
            return result.data;
        },
        []
    );

    const getPendingReviews = useCallback(async (): Promise<GetPendingReviewsResponse> => {
        const callable = httpsCallable<void, GetPendingReviewsResponse>(
            functions,
            'getPendingReviews'
        );
        const result = await callable();
        return result.data;
    }, []);

    const scoreHotTake = useCallback(
        async (hotTakeId: string, score: number): Promise<ScoreHotTakeResponse> => {
            const callable = httpsCallable<
                { hotTakeId: string; score: number },
                ScoreHotTakeResponse
            >(functions, 'scoreHotTake');
            const result = await callable({ hotTakeId, score });
            return result.data;
        },
        []
    );

    const getHotTakesFeed = useCallback(async (limit = 50): Promise<GetHotTakesFeedResponse> => {
        const callable = httpsCallable<{ limit: number }, GetHotTakesFeedResponse>(
            functions,
            'getHotTakesFeed'
        );
        const result = await callable({ limit });
        return result.data;
    }, []);

    const getTopHotTakes = useCallback(
        async (limit = 20, startAfter?: string): Promise<GetTopHotTakesResponse> => {
            const callable = httpsCallable<
                { limit: number; startAfter?: string },
                GetTopHotTakesResponse
            >(functions, 'getTopHotTakes');
            const result = await callable({ limit, startAfter });
            return result.data;
        },
        []
    );

    return {
        getUserSettings,
        updateUserSettings,
        resetUserSettings,
        getRewardsInfo,
        submitHotTake,
        getHotTakes,
        getMyHotTakes,
        approveHotTake,
        rejectHotTake,
        getPendingReviews,
        scoreHotTake,
        getHotTakesFeed,
        getTopHotTakes,
    };
}
