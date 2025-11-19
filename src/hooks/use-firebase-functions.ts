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

    return {
        getUserSettings,
        updateUserSettings,
        resetUserSettings,
        getRewardsInfo,
    };
}
