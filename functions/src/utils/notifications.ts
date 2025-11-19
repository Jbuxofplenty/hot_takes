import {getMessaging} from "firebase-admin/messaging";

/**
 * Send push notification to a user using Firebase Cloud Messaging
 * @param {string} userId - The user ID to send notification to
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Additional data payload
 */
export async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{success: boolean; error?: string}> {
  try {
    const {getFirestore} = await import("firebase-admin/firestore");
    const db = getFirestore();

    // Get user's push token
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.log(`User ${userId} not found`);
      return {success: false, error: "User not found"};
    }

    const userData = userDoc.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(`No push token found for user ${userId}`);
      return {success: false, error: "No push token"};
    }

    // Check if it's an Expo push token or FCM token
    const isExpoPushToken = pushToken.startsWith("ExponentPushToken[");

    if (isExpoPushToken) {
      // Use Expo's push notification service for Expo tokens (development)
      return await sendExpoPushNotification(pushToken, notification);
    } else {
      // Use Firebase Cloud Messaging for FCM tokens (production)
      return await sendFCMNotification(pushToken, notification);
    }
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification via Firebase Cloud Messaging
 */
async function sendFCMNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{success: boolean; error?: string}> {
  try {
    const message = {
      token: token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
      android: {
        priority: "high" as const,
        notification: {
          channelId: "default",
          sound: "default",
        },
      },
    };

    const response = await getMessaging().send(message);
    console.log("FCM notification sent successfully:", response);
    return {success: true};
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification via Expo Push Service (for development with Expo Go)
 */
async function sendExpoPushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{success: boolean; error?: string}> {
  try {
    const message = {
      to: token,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: "high",
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === "error") {
      console.error("Error sending Expo push notification:", result.data);
      return {success: false, error: result.data.message};
    }

    console.log("Expo push notification sent successfully:", result);
    return {success: true};
  } catch (error) {
    console.error("Error sending Expo push notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification to reviewers about a hot take needing review
 * @param {string} reviewerId - Reviewer's user ID
 * @param {string} hotTakeId - Hot take ID
 * @param {string} text - Hot take text (preview)
 * @param {number} toxicityScore - Maximum toxicity probability
 */
export async function sendReviewerNotification(
  reviewerId: string,
  hotTakeId: string,
  text: string,
  toxicityScore: number
): Promise<{success: boolean; error?: string}> {
  // Truncate text for notification preview
  const preview = text.length > 50 ? `${text.substring(0, 50)}...` : text;

  return sendPushNotification(reviewerId, {
    title: "Hot Take Needs Review",
    body: `Flagged content (${Math.round(toxicityScore * 100)}% confidence): "${preview}"`,
    data: {
      type: "review_needed",
      hotTakeId: hotTakeId,
      toxicityScore: toxicityScore.toFixed(2),
    },
  });
}

