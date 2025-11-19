import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Initialize or update a user's presence in Firestore
 * This should be called when a user connects or sends a heartbeat
 *
 * @param userId - The user's unique ID
 * @returns Promise that resolves when presence is updated
 */
export async function updateUserPresence(userId: string) {
    const batch = db.batch();

    // Update user presence document
    const userPresenceRef = db.collection('presence').doc(userId);
    batch.set(
        userPresenceRef,
        {
            online: true,
            lastSeen: FieldValue.serverTimestamp(),
            userId,
        },
        { merge: true }
    );

    await batch.commit();

    return {
        success: true,
        message: 'User presence updated',
    };
}

/**
 * Mark a user as offline
 *
 * @param userId - The user's unique ID
 * @returns Promise that resolves when presence is updated
 */
export async function markUserOffline(userId: string) {
    await db.collection('presence').doc(userId).set(
        {
            online: false,
            lastSeen: FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

    return {
        success: true,
        message: 'User marked offline',
    };
}

/**
 * Get current active player count
 * Counts users who are online and have a recent lastSeen (within 5 minutes)
 * @returns The number of currently active players
 */
export async function getActivePlayerCount(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const snapshot = await db
        .collection('presence')
        .where('online', '==', true)
        .where('lastSeen', '>', fiveMinutesAgo)
        .count()
        .get();

    return snapshot.data().count;
}

/**
 * Cleanup stale presence entries
 * Users who haven't updated their presence in the last 5 minutes
 * This should be run periodically via a scheduled function
 */
export async function cleanupStalePresence() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find all users marked as online but haven't sent heartbeat in 5+ minutes
    const staleUsersSnapshot = await db
        .collection('presence')
        .where('online', '==', true)
        .where('lastSeen', '<', fiveMinutesAgo)
        .get();

    if (staleUsersSnapshot.empty) {
        return {
            success: true,
            cleanedUp: 0,
        };
    }

    const batch = db.batch();
    staleUsersSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
            online: false,
            lastSeen: FieldValue.serverTimestamp(),
        });
    });

    await batch.commit();

    return {
        success: true,
        cleanedUp: staleUsersSnapshot.size,
    };
}
