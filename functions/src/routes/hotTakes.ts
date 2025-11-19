import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {
  analyzeToxicity,
  getMaxToxicityProbability,
  hasToxicContent,
} from "../utils/toxicityModel";
import {sendReviewerNotification} from "../utils/notifications";

/**
 * Review threshold - if toxicity probability exceeds this, send for manual review
 */
const REVIEW_THRESHOLD = 0.7;

/**
 * Handler for submitting a new hot take
 * Separated for testing purposes
 */
export async function submitHotTakeHandler(request: any) {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to submit a hot take"
      );
    }

    const userId = request.auth.uid;
    const {text} = request.data;

    // Validate input
    if (!text || typeof text !== "string") {
      throw new HttpsError("invalid-argument", "Hot take text is required");
    }

    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      throw new HttpsError("invalid-argument", "Hot take cannot be empty");
    }

    if (trimmedText.length > 150) {
      throw new HttpsError(
        "invalid-argument",
        "Hot take cannot exceed 150 characters"
      );
    }

    try {
      const db = getFirestore();

      // Get user info (optional - use auth display name as fallback)
      let userDisplayName = request.auth?.token?.name || "Anonymous";
      
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userDisplayName = userData?.displayName || userDisplayName;
        }
      } catch (error) {
        // If user doc doesn't exist, continue with auth display name
        console.log("User document not found, using auth display name");
      }

      // Run toxicity analysis synchronously
      console.log(`Analyzing toxicity for hot take by user ${userId}`);
      const toxicityResults = await analyzeToxicity(trimmedText);
      const needsReview = hasToxicContent(toxicityResults);
      const maxProbability = getMaxToxicityProbability(toxicityResults);

      const baseData = {
        text: trimmedText,
        userId,
        userDisplayName,
        createdAt: FieldValue.serverTimestamp(),
        likes: 0,
        flames: 0,
        toxicity: toxicityResults,
        toxicityAnalyzedAt: FieldValue.serverTimestamp(),
        maxToxicityProbability: maxProbability,
      };

      // If content exceeds threshold, send to review queue asynchronously
      if (needsReview || maxProbability >= REVIEW_THRESHOLD) {
        console.log(
          `Hot take flagged for review (toxic: ${needsReview}, max prob: ${maxProbability})`
        );

        // Save to needsReview collection
        const reviewRef = await db.collection("needsReview").add({
          ...baseData,
          status: "pending_review",
          reviewType: "toxicity",
          flaggedAt: FieldValue.serverTimestamp(),
        });

        console.log(`Hot take ${reviewRef.id} sent to review queue`);

        // Notify reviewers asynchronously (don't wait for it)
        notifyReviewers(reviewRef.id, trimmedText, userId, maxProbability).catch(
          (error) => {
            console.error("Failed to notify reviewers:", error);
          }
        );

        return {
          success: true,
          hotTakeId: reviewRef.id,
          message:
            "Hot take submitted and is under review. You'll be notified once approved!",
          status: "pending_review",
        };
      }

      // Content is safe - save directly to hotTakes as approved
      const hotTakeRef = await db.collection("hotTakes").add({
        ...baseData,
        status: "approved",
        approvedAt: FieldValue.serverTimestamp(),
      });

      console.log(`Hot take ${hotTakeRef.id} created and auto-approved`);

      return {
        success: true,
        hotTakeId: hotTakeRef.id,
        message: "Hot take submitted successfully!",
        status: "approved",
      };
    } catch (error) {
      console.error("Error submitting hot take:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to submit hot take");
    }
  }

/**
 * Submit a new hot take
 * This creates the document which triggers the toxicity analysis
 */
export const submitHotTake = onCall({region: "us-central1"}, submitHotTakeHandler);

/**
 * Handler for approving a hot take (reviewer only)
 * Separated for testing purposes
 */
export async function approveHotTakeHandler(request: any) {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const reviewerId = request.auth.uid;
    const {hotTakeId} = request.data;

    if (!hotTakeId) {
      throw new HttpsError("invalid-argument", "Hot take ID is required");
    }

    try {
      const db = getFirestore();

      // Verify user is a reviewer
      const reviewerDoc = await db.collection("users").doc(reviewerId).get();
      const reviewerData = reviewerDoc.data();

      if (!reviewerData?.reviewer) {
        throw new HttpsError(
          "permission-denied",
          "User is not authorized as a reviewer"
        );
      }

      // Get the hot take from needsReview
      const needsReviewDoc = await db
        .collection("needsReview")
        .doc(hotTakeId)
        .get();

      if (!needsReviewDoc.exists) {
        throw new HttpsError(
          "not-found",
          "Hot take not found in review queue"
        );
      }

      const hotTakeData = needsReviewDoc.data();

      // Move back to hotTakes collection with approved status
      await db
        .collection("hotTakes")
        .doc(hotTakeId)
        .set({
          ...hotTakeData,
          status: "approved",
          approvedAt: FieldValue.serverTimestamp(),
          approvedBy: reviewerId,
          reviewerDisplayName: reviewerData?.displayName || "Reviewer",
        });

      // Remove from needsReview
      await needsReviewDoc.ref.delete();

      console.log(`Hot take ${hotTakeId} approved by reviewer ${reviewerId}`);

      return {
        success: true,
        message: "Hot take approved",
      };
    } catch (error) {
      console.error("Error approving hot take:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to approve hot take");
    }
  }

/**
 * Approve a hot take (reviewer only)
 */
export const approveHotTake = onCall({region: "us-central1"}, approveHotTakeHandler);

/**
 * Handler for rejecting a hot take (reviewer only)
 * Separated for testing purposes
 */
export async function rejectHotTakeHandler(request: any) {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const reviewerId = request.auth.uid;
    const {hotTakeId, reason} = request.data;

    if (!hotTakeId) {
      throw new HttpsError("invalid-argument", "Hot take ID is required");
    }

    try {
      const db = getFirestore();

      // Verify user is a reviewer
      const reviewerDoc = await db.collection("users").doc(reviewerId).get();
      const reviewerData = reviewerDoc.data();

      if (!reviewerData?.reviewer) {
        throw new HttpsError(
          "permission-denied",
          "User is not authorized as a reviewer"
        );
      }

      // Get the hot take from needsReview
      const needsReviewDoc = await db
        .collection("needsReview")
        .doc(hotTakeId)
        .get();

      if (!needsReviewDoc.exists) {
        throw new HttpsError(
          "not-found",
          "Hot take not found in review queue"
        );
      }

      const hotTakeData = needsReviewDoc.data();

      // Move to rejected collection for record keeping
      await db
        .collection("rejectedHotTakes")
        .doc(hotTakeId)
        .set({
          ...hotTakeData,
          status: "rejected",
          rejectedAt: FieldValue.serverTimestamp(),
          rejectedBy: reviewerId,
          reviewerDisplayName: reviewerData?.displayName || "Reviewer",
          rejectionReason: reason || "Content policy violation",
        });

      // Remove from needsReview
      await needsReviewDoc.ref.delete();

      console.log(`Hot take ${hotTakeId} rejected by reviewer ${reviewerId}`);

      return {
        success: true,
        message: "Hot take rejected",
      };
    } catch (error) {
      console.error("Error rejecting hot take:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to reject hot take");
    }
  }

/**
 * Reject a hot take (reviewer only)
 */
export const rejectHotTake = onCall({region: "us-central1"}, rejectHotTakeHandler);

/**
 * Handler for getting pending hot takes for review (reviewer only)
 * Separated for testing purposes
 */
export async function getPendingReviewsHandler(request: any) {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;

    try {
      const db = getFirestore();

      // Verify user is a reviewer
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.reviewer) {
        throw new HttpsError(
          "permission-denied",
          "User is not authorized as a reviewer"
        );
      }

      // Get all pending reviews
      const needsReviewSnapshot = await db
        .collection("needsReview")
        .where("status", "==", "pending_review")
        .orderBy("flaggedAt", "desc")
        .limit(50)
        .get();

      const pendingReviews = needsReviewSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        reviews: pendingReviews,
        count: pendingReviews.length,
      };
    } catch (error) {
      console.error("Error getting pending reviews:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to get pending reviews");
    }
  }

/**
 * Get pending hot takes for review (reviewer only)
 */
export const getPendingReviews = onCall({region: "us-central1"}, getPendingReviewsHandler);

/**
 * Handler for getting user's own hot takes
 * Separated for testing purposes
 */
export async function getMyHotTakesHandler(request: any) {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const {limit = 20, startAfter} = request.data;

    try {
      const db = getFirestore();

      let query = db
        .collection("hotTakes")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (startAfter) {
        const startAfterDoc = await db
          .collection("hotTakes")
          .doc(startAfter)
          .get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();

      const hotTakes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        hotTakes,
        hasMore: snapshot.docs.length === limit,
      };
    } catch (error) {
      console.error("Error getting user hot takes:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to get hot takes");
    }
  }

/**
 * Get user's own hot takes
 */
export const getMyHotTakes = onCall({region: "us-central1"}, getMyHotTakesHandler);

/**
 * Handler for getting all approved hot takes (public feed)
 * Separated for testing purposes
 */
export async function getHotTakesHandler(request: any) {
  const {limit = 20, startAfter} = request.data;

  try {
    const db = getFirestore();

    let query = db
      .collection("hotTakes")
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (startAfter) {
      const startAfterDoc = await db.collection("hotTakes").doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();

    const hotTakes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      hotTakes,
      hasMore: snapshot.docs.length === limit,
    };
  } catch (error) {
    console.error("Error getting hot takes:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to get hot takes");
  }
}

/**
 * Get all approved hot takes (public feed)
 */
export const getHotTakes = onCall({region: "us-central1"}, getHotTakesHandler);

/**
 * Notify all reviewers about a hot take needing review
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
    // Don't throw - notification failure shouldn't block the submission
  }
}

