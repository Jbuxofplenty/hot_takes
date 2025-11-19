import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

/**
 * Score a hot take (1-10 scale)
 */
export async function scoreHotTakeHandler(request: any) {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;
  const {hotTakeId, score} = request.data;

  // Validate input
  if (!hotTakeId) {
    throw new HttpsError("invalid-argument", "Hot take ID is required");
  }

  if (
    typeof score !== "number" ||
    score < 1 ||
    score > 10 ||
    !Number.isInteger(score)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Score must be an integer between 1 and 10"
    );
  }

  try {
    const db = getFirestore();

    // Check if hot take exists
    const hotTakeDoc = await db.collection("hotTakes").doc(hotTakeId).get();

    if (!hotTakeDoc.exists) {
      throw new HttpsError("not-found", "Hot take not found");
    }

    const hotTakeData = hotTakeDoc.data();

    // Don't let users score their own hot takes
    if (hotTakeData?.userId === userId) {
      throw new HttpsError(
        "permission-denied",
        "You cannot score your own hot take"
      );
    }

    // Check if user already scored this
    const scoreRef = db
      .collection("hotTakes")
      .doc(hotTakeId)
      .collection("scores")
      .doc(userId);

    const existingScore = await scoreRef.get();

    // Save the score
    await scoreRef.set({
      score,
      userId,
      scoredAt: FieldValue.serverTimestamp(),
    });

    // Calculate new average
    const scoresSnapshot = await db
      .collection("hotTakes")
      .doc(hotTakeId)
      .collection("scores")
      .get();

    const scores = scoresSnapshot.docs.map((doc) => doc.data().score);
    const totalScores = scores.length;
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalScores;

    // Update hot take with new stats
    await hotTakeDoc.ref.update({
      totalScores,
      averageScore: Number(averageScore.toFixed(2)),
      lastScoredAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `User ${userId} ${existingScore.exists ? "updated" : "added"} score ${score} for hot take ${hotTakeId}`
    );

    return {
      success: true,
      message: existingScore.exists ? "Score updated" : "Score added",
      totalScores,
      averageScore: Number(averageScore.toFixed(2)),
    };
  } catch (error) {
    console.error("Error scoring hot take:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to score hot take");
  }
}

/**
 * Score a hot take
 */
export const scoreHotTake = onCall({region: "us-central1"}, scoreHotTakeHandler);

/**
 * Get hot takes feed with weekly grouping
 */
export async function getHotTakesFeedHandler(request: any) {
  const {limit = 50} = request.data;

  try {
    const db = getFirestore();

    // Get all approved hot takes with scores
    const snapshot = await db
      .collection("hotTakes")
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const hotTakes = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get user's score if authenticated
        let userScore = null;
        if (request.auth) {
          const userScoreDoc = await doc.ref
            .collection("scores")
            .doc(request.auth.uid)
            .get();
          if (userScoreDoc.exists) {
            userScore = userScoreDoc.data()?.score || null;
          }
        }

        return {
          id: doc.id,
          text: data.text,
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          totalScores: data.totalScores || 0,
          averageScore: data.averageScore || 0,
          userScore,
        };
      })
    );

    // Group by week
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const startOfCurrentWeek = now - (now % oneWeek);

    const currentWeek: any[] = [];
    const previousWeeks: any[] = [];

    hotTakes.forEach((take) => {
      if (take.createdAt >= startOfCurrentWeek) {
        currentWeek.push(take);
      } else {
        previousWeeks.push(take);
      }
    });

    // Calculate rankings for current week
    const rankedCurrentWeek = currentWeek
      .sort((a, b) => {
        // Sort by average score desc, then total scores desc
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }
        return b.totalScores - a.totalScores;
      })
      .map((take, index) => ({
        ...take,
        rank: index + 1,
        totalInWeek: currentWeek.length,
      }));

    return {
      success: true,
      currentWeek: rankedCurrentWeek,
      previousWeeks,
      totalTakes: hotTakes.length,
    };
  } catch (error) {
    console.error("Error getting hot takes feed:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to get hot takes feed");
  }
}

/**
 * Get hot takes feed with weekly grouping
 */
export const getHotTakesFeed = onCall(
  {region: "us-central1"},
  getHotTakesFeedHandler
);

/**
 * Get top hot takes of all time (paginated)
 */
export async function getTopHotTakesHandler(request: any) {
  const {limit = 20, startAfter} = request.data;

  try {
    const db = getFirestore();

    // Build query for approved hot takes with scores, ordered by average score
    let query = db
      .collection("hotTakes")
      .where("status", "==", "approved")
      .where("totalScores", ">", 0) // Only include takes that have been scored
      .orderBy("totalScores", "desc") // First order by number of scores
      .orderBy("averageScore", "desc") // Then by average score
      .orderBy("createdAt", "desc") // Finally by creation date for consistency
      .limit(limit);

    // Handle pagination
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

    const hotTakes = await Promise.all(
      snapshot.docs.map(async (doc, index) => {
        const data = doc.data();

        // Get user's score if authenticated
        let userScore = null;
        if (request.auth) {
          const userScoreDoc = await doc.ref
            .collection("scores")
            .doc(request.auth.uid)
            .get();
          if (userScoreDoc.exists) {
            userScore = userScoreDoc.data()?.score || null;
          }
        }

        // Calculate overall rank (approximation based on query position)
        const rank = startAfter ?
          -1 : // Don't show rank for paginated results (hard to calculate accurately)
          index + 1;

        return {
          id: doc.id,
          text: data.text,
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          totalScores: data.totalScores || 0,
          averageScore: data.averageScore || 0,
          userScore,
          rank: rank > 0 ? rank : undefined,
        };
      })
    );

    return {
      success: true,
      hotTakes,
      hasMore: snapshot.docs.length === limit,
      lastId: snapshot.docs.length > 0 ?
        snapshot.docs[snapshot.docs.length - 1].id :
        null,
    };
  } catch (error) {
    console.error("Error getting top hot takes:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to get top hot takes");
  }
}

/**
 * Get top hot takes of all time (paginated)
 */
export const getTopHotTakes = onCall(
  {region: "us-central1"},
  getTopHotTakesHandler
);

