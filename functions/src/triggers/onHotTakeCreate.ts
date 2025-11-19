import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {
  analyzeToxicity,
  hasToxicContent,
  getMaxToxicityProbability,
  type ToxicityResult,
} from "../utils/toxicityModel";
import {sendReviewerNotification} from "../utils/notifications";

/**
 * Review threshold - if toxicity probability exceeds this, send for manual review
 * This is separate from the model threshold (0.8) and acts as a policy decision
 */
const REVIEW_THRESHOLD = 0.7;

/**
 * Firestore trigger that runs when a hot take needs review
 * This is now only for documents that were flagged during submission
 * Most analysis happens synchronously in submitHotTake
 */
export const onHotTakeNeedsReview = onDocumentCreated(
  {
    document: "needsReview/{hotTakeId}",
    region: "us-central1",
    memory: "512MiB", // Reduced since we're not running ML model here
    timeoutSeconds: 30,
  },
  async (event) => {
    const snapshot = event.data;
    const hotTakeId = event.params.hotTakeId;

    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const data = snapshot.data();

    try {
      console.log(`Processing review request ${hotTakeId}`);

      // Document was already analyzed during submission
      // This trigger is mainly for logging and potential additional processing
      const text = data.text;
      const userId = data.userId;
      const maxProbability = data.maxToxicityProbability || 0;

      console.log(
        `Review request ${hotTakeId} created (toxicity: ${maxProbability.toFixed(2)})`
      );

      // Notify reviewers (if not already done)
      await notifyReviewers(hotTakeId, text, userId, maxProbability);
    } catch (error) {
      console.error(`Error processing review request ${hotTakeId}:`, error);
      // Don't throw - notification failure shouldn't block the process
    }
  }
);

/**
 * Notify all reviewers about content needing review
 */
async function notifyReviewers(
  hotTakeId: string,
  text: string,
  userId: string,
  maxProbability: number
): Promise<void> {
  try {
    const db = getFirestore();

    // Find all users with reviewer=true
    const reviewersSnapshot = await db
      .collection("users")
      .where("reviewer", "==", true)
      .get();

    if (reviewersSnapshot.empty) {
      console.log("No reviewers found to notify");
      return;
    }

    const notificationPromises = reviewersSnapshot.docs.map(
      async (reviewerDoc) => {
        const reviewerId = reviewerDoc.id;

        // Don't notify the user who created the hot take
        if (reviewerId === userId) {
          return;
        }

        try {
          await sendReviewerNotification(
            reviewerId,
            hotTakeId,
            text,
            maxProbability
          );
          console.log(
            `Notified reviewer ${reviewerId} about hot take ${hotTakeId}`
          );
        } catch (error) {
          console.error(`Failed to notify reviewer ${reviewerId}:`, error);
          // Continue with other notifications even if one fails
        }
      }
    );

    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error("Error notifying reviewers:", error);
    // Don't throw - notification failure shouldn't block the review process
  }
}

