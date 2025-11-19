import {HttpsError, onCall} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import {getAppCheckConfig} from "../utils/appCheckConfig";
import {getDefaultSettings} from "../utils/helpers";

const db = getFirestore();

/**
 * Handler for getting user settings
 * Separated for testing purposes
 */
export async function getUserSettingsHandler(request: any) {
  const {auth} = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = auth.uid;
  const settingsDoc = await db
    .collection("users")
    .doc(userId)
    .collection("settings")
    .doc("preferences")
    .get();

  if (!settingsDoc.exists) {
    // Return default settings if none exist
    return {
      success: true,
      settings: getDefaultSettings(),
    };
  }

  return {
    success: true,
    settings: settingsDoc.data(),
  };
}

/**
 * Get user settings
 */
export const getUserSettings = onCall(getAppCheckConfig(), getUserSettingsHandler);

/**
 * Handler for updating user settings
 * Separated for testing purposes
 */
export async function updateUserSettingsHandler(request: any) {
  const {data, auth} = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = auth.uid;
  const {settings} = data;

  if (!settings) {
    throw new HttpsError("invalid-argument", "Settings data is required");
  }

  // Validate theme if provided
  if (settings.theme && !["light", "dark", "auto"].includes(settings.theme)) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid theme value. Must be light, dark, or auto"
    );
  }

  // Validate isAnonymous if provided
  if (
    settings.isAnonymous !== undefined &&
    typeof settings.isAnonymous !== "boolean"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid isAnonymous value. Must be a boolean"
    );
  }

  // Validate and sanitize settings
  const validatedSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  // Update settings subcollection
  await db
    .collection("users")
    .doc(userId)
    .collection("settings")
    .doc("preferences")
    .set(validatedSettings, {merge: true});

  return {
    success: true,
    message: "Settings updated successfully",
    settings: validatedSettings,
  };
}

/**
 * Update user settings
 */
export const updateUserSettings = onCall(getAppCheckConfig(), updateUserSettingsHandler);

/**
 * Handler for resetting user settings
 * Separated for testing purposes
 */
export async function resetUserSettingsHandler(request: any) {
  const {auth} = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = auth.uid;
  const defaultSettings = getDefaultSettings();

  await db
    .collection("users")
    .doc(userId)
    .collection("settings")
    .doc("preferences")
    .set({
      ...defaultSettings,
      updatedAt: new Date().toISOString(),
    });

  return {
    success: true,
    message: "Settings reset to defaults",
    settings: defaultSettings,
  };
}

/**
 * Reset user settings to defaults
 */
export const resetUserSettings = onCall(getAppCheckConfig(), resetUserSettingsHandler);

