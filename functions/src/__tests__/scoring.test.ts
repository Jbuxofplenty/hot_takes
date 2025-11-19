import {getFirestore} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";

import {
  scoreHotTakeHandler,
  getTopHotTakesHandler,
  getHotTakesFeedHandler,
} from "../routes/scoring";

// Mock Firebase Admin
jest.mock("firebase-admin/firestore");

describe("Scoring Functions", () => {
  let mockFirestore: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: any;
  let mockSet: any;
  let mockUpdate: any;
  let mockWhere: any;
  let mockOrderBy: any;
  let mockLimit: any;
  let mockStartAfter: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock chains
    mockGet = jest.fn();
    mockSet = jest.fn();
    mockUpdate = jest.fn();
    mockStartAfter = jest.fn();
    mockLimit = jest.fn();
    mockOrderBy = jest.fn();
    mockWhere = jest.fn();

    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
      collection: mockCollection,
    }));

    mockCollection = jest.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      startAfter: mockStartAfter,
      get: mockGet,
      add: jest.fn(),
    }));

    mockFirestore = {
      collection: mockCollection,
      doc: mockDoc,
    };

    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);

    // Setup default chain returns
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
      where: mockWhere,
    });
    mockOrderBy.mockReturnValue({
      orderBy: mockOrderBy,
      limit: mockLimit,
      startAfter: mockStartAfter,
    });
    mockLimit.mockReturnValue({
      get: mockGet,
      startAfter: mockStartAfter,
    });
    mockStartAfter.mockReturnValue({
      get: mockGet,
    });
  });

  describe("scoreHotTakeHandler", () => {
    it("should score a hot take successfully", async () => {
      const mockRequest = {
        auth: {uid: "user123"},
        data: {
          hotTakeId: "hottake123",
          score: 8,
        },
      };

      // Mock score doc operations
      const mockScoreDoc = {
        get: jest.fn().mockResolvedValue({exists: false}),
        set: mockSet,
      };

      const mockScoresCollectionGet = jest.fn().mockResolvedValue({
        docs: [
          {data: () => ({score: 6})},
          {data: () => ({score: 7})},
          {data: () => ({score: 8})},
          {data: () => ({score: 7})},
          {data: () => ({score: 6})},
          {data: () => ({score: 8})}, // The new score
        ],
      });

      const mockScoresCollection = {
        doc: jest.fn().mockReturnValue(mockScoreDoc),
        get: mockScoresCollectionGet,
      };

      // Mock hot take document
      const mockHotTakeDoc = {
        exists: true,
        data: () => ({
          status: "approved",
          totalScores: 5,
          averageScore: 7,
        }),
        ref: {
          update: mockUpdate,
        },
      };

      // Setup the chain: collection("hotTakes").doc(hotTakeId)
      const mockHotTakeDocRef = {
        get: jest.fn().mockResolvedValue(mockHotTakeDoc),
        collection: jest.fn().mockReturnValue(mockScoresCollection),
      };

      mockCollection.mockImplementation((collectionName: string) => {
        if (collectionName === "hotTakes") {
          return {
            doc: jest.fn().mockReturnValue(mockHotTakeDocRef),
          };
        }
        return {
          doc: mockDoc,
        };
      });

      mockSet.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue(undefined);

      const result = await scoreHotTakeHandler(mockRequest);

      expect(result.success).toBe(true);
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.totalScores).toBeGreaterThan(0);
      expect(mockSet).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should fail if user is not authenticated", async () => {
      const mockRequest = {
        auth: null,
        data: {
          hotTakeId: "hottake123",
          score: 85,
        },
      };

      await expect(scoreHotTakeHandler(mockRequest)).rejects.toThrow(
        HttpsError
      );
    });

    it("should fail if score is out of range", async () => {
      const mockRequest = {
        auth: {uid: "user123"},
        data: {
          hotTakeId: "hottake123",
          score: 15, // Out of range (max is 10)
        },
      };

      await expect(scoreHotTakeHandler(mockRequest)).rejects.toThrow(
        HttpsError
      );
    });
  });

  describe("getTopHotTakesHandler", () => {
    it("should get top hot takes successfully", async () => {
      const mockRequest = {
        auth: {uid: "user123"},
        data: {
          limit: 20,
        },
      };

      const mockHotTakes = [
        {
          id: "take1",
          data: () => ({
            text: "Hot take 1",
            userId: "user1",
            userDisplayName: "User One",
            createdAt: {toMillis: () => Date.now()},
            status: "approved",
            totalScores: 100,
            averageScore: 90,
          }),
          ref: {
            collection: jest.fn(() => ({
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({score: 8}),
                }),
              })),
            })),
          },
        },
        {
          id: "take2",
          data: () => ({
            text: "Hot take 2",
            userId: "user2",
            userDisplayName: "User Two",
            createdAt: {toMillis: () => Date.now()},
            status: "approved",
            totalScores: 80,
            averageScore: 85,
          }),
          ref: {
            collection: jest.fn(() => ({
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  exists: false,
                }),
              })),
            })),
          },
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockHotTakes,
      });

      const result = await getTopHotTakesHandler(mockRequest);

      expect(result.success).toBe(true);
      expect(result.hotTakes).toHaveLength(2);
      expect(result.hotTakes[0].rank).toBe(1);
      expect(result.hotTakes[0].userScore).toBe(8);
      expect(result.hotTakes[1].userScore).toBeNull();
      expect(result.hasMore).toBe(false);
    });

    it("should handle pagination with startAfter", async () => {
      const mockRequest = {
        auth: {uid: "user123"},
        data: {
          limit: 20,
          startAfter: "take1",
        },
      };

      // Mock startAfter doc
      mockGet.mockResolvedValueOnce({
        exists: true,
      });

      // Mock paginated results
      const mockHotTakes = [
        {
          id: "take3",
          data: () => ({
            text: "Hot take 3",
            userId: "user3",
            userDisplayName: "User Three",
            createdAt: {toMillis: () => Date.now()},
            status: "approved",
            totalScores: 70,
            averageScore: 80,
          }),
          ref: {
            collection: jest.fn(() => ({
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  exists: false,
                }),
              })),
            })),
          },
        },
      ];

      mockGet.mockResolvedValueOnce({
        docs: mockHotTakes,
      });

      const result = await getTopHotTakesHandler(mockRequest);

      expect(result.success).toBe(true);
      expect(result.hotTakes).toHaveLength(1);
      expect(result.hotTakes[0].rank).toBeUndefined(); // No rank for paginated results
      expect(result.lastId).toBe("take3");
    });

    it("should return empty array when no hot takes found", async () => {
      const mockRequest = {
        auth: {uid: "user123"},
        data: {
          limit: 20,
        },
      };

      mockGet.mockResolvedValue({
        docs: [],
      });

      const result = await getTopHotTakesHandler(mockRequest);

      expect(result.success).toBe(true);
      expect(result.hotTakes).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.lastId).toBeNull();
    });

    it("should work without authentication", async () => {
      const mockRequest = {
        auth: null,
        data: {
          limit: 20,
        },
      };

      const mockHotTakes = [
        {
          id: "take1",
          data: () => ({
            text: "Hot take 1",
            userId: "user1",
            userDisplayName: "User One",
            createdAt: {toMillis: () => Date.now()},
            status: "approved",
            totalScores: 100,
            averageScore: 90,
          }),
          ref: {
            collection: jest.fn(),
          },
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockHotTakes,
      });

      const result = await getTopHotTakesHandler(mockRequest);

      expect(result.success).toBe(true);
      expect(result.hotTakes).toHaveLength(1);
      expect(result.hotTakes[0].userScore).toBeNull();
    });
  });

  describe("getHotTakesFeedHandler", () => {
    it("should get hot takes feed with weekly grouping", async () => {
      const mockRequest = {
        auth: {uid: "user123"},
        data: {
          limit: 50,
        },
      };

      const now = Date.now();
      const currentWeekStart = now - (3 * 24 * 60 * 60 * 1000); // 3 days ago
      const lastWeekDate = now - (10 * 24 * 60 * 60 * 1000); // 10 days ago

      const mockHotTakes = [
        {
          id: "take1",
          data: () => ({
            text: "Current week take",
            userId: "user1",
            userDisplayName: "User One",
            createdAt: {toMillis: () => currentWeekStart},
            status: "approved",
            totalScores: 50,
            averageScore: 85,
          }),
          ref: {
            collection: jest.fn(() => ({
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({score: 8}),
                }),
              })),
            })),
          },
        },
        {
          id: "take2",
          data: () => ({
            text: "Last week take",
            userId: "user2",
            userDisplayName: "User Two",
            createdAt: {toMillis: () => lastWeekDate},
            status: "approved",
            totalScores: 40,
            averageScore: 75,
          }),
          ref: {
            collection: jest.fn(() => ({
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  exists: false,
                }),
              })),
            })),
          },
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockHotTakes,
      });

      const result = await getHotTakesFeedHandler(mockRequest);

      expect(result.success).toBe(true);
      expect(result.currentWeek.length).toBeGreaterThan(0);
      expect(result.previousWeeks.length).toBeGreaterThan(0);
      expect(result.totalTakes).toBe(2);
    });
  });
});

