import {FieldValue} from "firebase-admin/firestore";

/**
 * Get default user settings
 * @returns {Object} Default settings object
 */
export function getDefaultSettings() {
  return {
    // Theme preference
    theme: "auto" as "light" | "dark" | "auto",
    // Anonymous posting preference
    isAnonymous: false,
  };
}

/**
 * Get server timestamp for Firestore
 * @returns {FieldValue} Server timestamp
 */
export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

/**
 * Get Firestore increment value
 * @param {number} amount - Amount to increment by
 * @returns {FieldValue} Increment value
 */
export function increment(amount: number) {
  return FieldValue.increment(amount);
}

