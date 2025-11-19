import {onSchedule} from "firebase-functions/v2/scheduler";
import {cleanupStalePresence} from "../utils/presenceSystem";

/**
 * Scheduled function to cleanup stale presence entries
 * Runs every 5 minutes to remove users who haven't sent a heartbeat
 */
export const cleanupStalePresenceScheduled = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/New_York",
  },
  async (_event) => {
    console.log("Running stale presence cleanup...");
    const result = await cleanupStalePresence();
    console.log(`Cleaned up ${result.cleanedUp} stale presence entries`);
  }
);

