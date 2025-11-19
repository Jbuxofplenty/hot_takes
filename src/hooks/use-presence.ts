import {useEffect, useRef} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {doc, serverTimestamp, setDoc} from 'firebase/firestore';
import {db} from '@/config/firebase';
import {useAuth} from '@/contexts';

/**
 * Hook to manage user presence in Firestore
 * Automatically sets user as online when mounted and offline when unmounted
 * Sends heartbeat updates every 2 minutes to keep presence alive
 *
 * Note: Without Realtime Database's onDisconnect(), we rely on:
 * 1. Client-side cleanup on unmount
 * 2. Heartbeat mechanism (every 2 minutes)
 * 3. Server-side scheduled cleanup for stale connections
 */
export function usePresence() {
    const {user} = useAuth();
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const appStateRef = useRef(AppState.currentState);

    useEffect(() => {
        if (!user) return;

        const userPresenceRef = doc(db, 'presence', user.uid);

        // Function to update presence
        const updatePresence = async () => {
            try {
                await setDoc(
                    userPresenceRef,
                    {
                        online: true,
                        lastSeen: serverTimestamp(),
                        userId: user.uid,
                    },
                    {merge: true}
                );
            } catch (error) {
                console.error('Error updating presence:', error);
            }
        };

        // Set initial presence
        updatePresence();

        // Set up heartbeat (update every 2 minutes)
        heartbeatIntervalRef.current = setInterval(() => {
            updatePresence();
        }, 2 * 60 * 1000); // 2 minutes

        // Handle app state changes (background/foreground)
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to foreground - update presence
                updatePresence();
                
                // Restart heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                }
                heartbeatIntervalRef.current = setInterval(() => {
                    updatePresence();
                }, 2 * 60 * 1000);
            }

            appStateRef.current = nextAppState;
        };

        // Subscribe to app state changes
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Cleanup function
        return () => {
            // Mark user as offline
            setDoc(
                userPresenceRef,
                {
                    online: false,
                    lastSeen: serverTimestamp(),
                },
                {merge: true}
            ).catch((error) => {
                console.error('Error marking user offline:', error);
            });

            // Clear interval
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }

            // Unsubscribe from app state changes
            subscription.remove();
        };
    }, [user]);
}

