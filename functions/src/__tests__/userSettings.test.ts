// Mock firebase-admin
import * as userSettings from "../routes/userSettings";

const mockSet = jest.fn();
const mockGet = jest.fn();

jest.mock("firebase-admin/firestore", () => {
  const mockInnerDoc = jest.fn(() => ({
    get: mockGet,
    set: mockSet,
  }));
  const mockInnerCollection = jest.fn(() => ({
    doc: mockInnerDoc,
  }));
  const mockDoc = jest.fn(() => ({
    get: mockGet,
    set: mockSet,
    collection: mockInnerCollection,
  }));
  const mockCollection = jest.fn(() => ({
    doc: mockDoc,
  }));

  return {
    getFirestore: jest.fn(() => ({
      collection: mockCollection,
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
      increment: jest.fn((amount: number) => `INCREMENT(${amount})`),
    },
  };
});

describe("User Settings Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserSettings", () => {
    it("should return default settings if none exist", async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const result = await userSettings.getUserSettingsHandler({
        data: {},
        auth: {uid: "test-user-123"},
      });

      expect(result.success).toBe(true);
      expect(result.settings?.theme).toBe("auto");
      expect(result.settings?.isAnonymous).toBe(false);
    });

    it("should return existing settings", async () => {
      const existingSettings = {
        theme: "dark",
        isAnonymous: true,
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      mockGet.mockResolvedValue({
        exists: true,
        data: () => existingSettings,
      });

      const result = await userSettings.getUserSettingsHandler({
        data: {},
        auth: {uid: "test-user-123"},
      });

      expect(result.success).toBe(true);
      expect(result.settings).toEqual(existingSettings);
    });

    it("should throw error if user not authenticated", async () => {
      await expect(
        userSettings.getUserSettingsHandler({
          data: {},
          auth: null,
        })
      ).rejects.toThrow("User must be authenticated");
    });
  });

  describe("updateUserSettings", () => {
    it("should update settings successfully", async () => {
      const newSettings = {
        theme: "light",
        isAnonymous: true,
      };

      mockSet.mockResolvedValue(undefined);

      const result = await userSettings.updateUserSettingsHandler({
        data: {settings: newSettings},
        auth: {uid: "test-user-123"},
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Settings updated successfully");
      expect(mockSet).toHaveBeenCalled();
    });

    it("should update only isAnonymous setting", async () => {
      const newSettings = {
        isAnonymous: false,
      };

      mockSet.mockResolvedValue(undefined);

      const result = await userSettings.updateUserSettingsHandler({
        data: {settings: newSettings},
        auth: {uid: "test-user-123"},
      });

      expect(result.success).toBe(true);
      expect(mockSet).toHaveBeenCalled();
    });

    it("should throw error if settings data is missing", async () => {
      await expect(
        userSettings.updateUserSettingsHandler({
          data: {},
          auth: {uid: "test-user-123"},
        })
      ).rejects.toThrow("Settings data is required");
    });

    it("should throw error for invalid theme value", async () => {
      await expect(
        userSettings.updateUserSettingsHandler({
          data: {settings: {theme: "invalid"}},
          auth: {uid: "test-user-123"},
        })
      ).rejects.toThrow("Invalid theme value");
    });

    it("should throw error for invalid isAnonymous value", async () => {
      await expect(
        userSettings.updateUserSettingsHandler({
          data: {settings: {isAnonymous: "not-a-boolean"}},
          auth: {uid: "test-user-123"},
        })
      ).rejects.toThrow("Invalid isAnonymous value");
    });

    it("should throw error if user not authenticated", async () => {
      await expect(
        userSettings.updateUserSettingsHandler({
          data: {settings: {theme: "dark"}},
          auth: null,
        })
      ).rejects.toThrow("User must be authenticated");
    });
  });

  describe("resetUserSettings", () => {
    it("should reset settings to defaults", async () => {
      mockSet.mockResolvedValue(undefined);

      const result = await userSettings.resetUserSettingsHandler({
        data: {},
        auth: {uid: "test-user-123"},
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Settings reset to defaults");
      expect(result.settings?.theme).toBe("auto");
      expect(result.settings?.isAnonymous).toBe(false);
      expect(mockSet).toHaveBeenCalled();
    });

    it("should throw error if user not authenticated", async () => {
      await expect(
        userSettings.resetUserSettingsHandler({
          data: {},
          auth: null,
        })
      ).rejects.toThrow("User must be authenticated");
    });
  });
});

