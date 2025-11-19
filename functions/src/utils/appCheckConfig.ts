import {CallableOptions} from "firebase-functions/v2/https";

/**
 * Get App Check configuration for Cloud Functions
 * Set enforceAppCheck to false for development/testing
 * Set to true in production once App Check is properly configured
 *
 * @returns {CallableOptions} Configuration object for onCall functions
 */
export function getAppCheckConfig(): CallableOptions {
  return {
    enforceAppCheck: false, // Set to true in production with App Check
  };
}

