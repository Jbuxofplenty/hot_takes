import {getFirestore} from "firebase-admin/firestore";

import {
  submitHotTakeHandler,
  approveHotTakeHandler,
  rejectHotTakeHandler,
  getPendingReviewsHandler,
  getMyHotTakesHandler,
  getHotTakesHandler,
} from "../routes/hotTakes";

import {
  analyzeToxicity,
  hasToxicContent,
  getMaxToxicityProbability,
} from "../utils/toxicityModel";

// Mock Firebase Admin
jest.mock("firebase-admin/firestore");
jest.mock("firebase-admin/messaging");

// Mock the toxicity model
jest.mock("../utils/toxicityModel", () => ({
  analyzeToxicity: jest.fn(),
  hasToxicContent: jest.fn(),
  getMaxToxicityProbability: jest.fn(),
  getMatchedCategories: jest.fn(),
  getToxicityThreshold: jest.fn(() => 0.8),
}));

// Mock notifications
jest.mock("../utils/notifications", () => ({
  sendReviewerNotification: jest.fn(),
  sendPushNotification: jest.fn(),
}));

describe("Hot Takes Functions", () => {
  let mockFirestore: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockAdd: any;
  let mockGet: any;
  let mockSet: any;
  let mockUpdate: any;
  let mockDelete: any;
  let mockWhere: any;
  let mockOrderBy: any;
  let mockLimit: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Firestore mocks
    mockDelete = jest.fn().mockResolvedValue(undefined);
    mockUpdate = jest.fn().mockResolvedValue(undefined);
    mockSet = jest.fn().mockResolvedValue(undefined);
    mockGet = jest.fn();
    mockAdd = jest.fn();

    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
      delete: mockDelete,
    }));

    mockLimit = jest.fn(() => ({
      get: mockGet,
    }));

    mockOrderBy = jest.fn(() => ({
      limit: mockLimit,
      get: mockGet,
    }));

    mockWhere = jest.fn(() => ({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
    }));

    mockCollection = jest.fn(() => ({
      add: mockAdd,
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
    }));

    mockFirestore = {
      collection: mockCollection,
    };

    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe("submitHotTake", () => {
    it("should successfully submit a hot take", async () => {
      const mockUserId = "user123";
      const mockText = "This is my hot take!";
      const mockHotTakeId = "hottake123";

      // Mock user document
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({displayName: "Test User"}),
      });

      // Mock add hot take
      mockAdd.mockResolvedValue({id: mockHotTakeId});

      const request = {
        auth: {
          uid: mockUserId,
          token: {name: "Test User"},
        },
        data: {text: mockText},
      };

      // @ts-ignore - Mock request object
      const result = await submitHotTakeHandler(request);

      expect(result.success).toBe(true);
      expect(result.hotTakeId).toBe(mockHotTakeId);
      expect(mockCollection).toHaveBeenCalledWith("users");
      expect(mockCollection).toHaveBeenCalledWith("hotTakes");
      expect(mockAdd).toHaveBeenCalled();
    });

    it("should reject unauthenticated requests", async () => {
      const request = {
        auth: null,
        data: {text: "Test"},
      };

      // @ts-ignore - Mock request object
      await expect(submitHotTakeHandler(request)).rejects.toThrow(
        "User must be authenticated to submit a hot take"
      );
    });

    it("should reject empty text", async () => {
      const request = {
        auth: {uid: "user123"},
        data: {text: "   "},
      };

      // @ts-ignore - Mock request object
      await expect(submitHotTakeHandler(request)).rejects.toThrow(
        "Hot take cannot be empty"
      );
    });

    it("should reject text over 150 characters", async () => {
      const longText = "a".repeat(151);
      const request = {
        auth: {uid: "user123"},
        data: {text: longText},
      };

      // @ts-ignore - Mock request object
      await expect(submitHotTakeHandler(request)).rejects.toThrow(
        "Hot take cannot exceed 150 characters"
      );
    });
  });

  describe("approveHotTake", () => {
    it("should approve a hot take when user is a reviewer", async () => {
      const mockReviewerId = "reviewer123";
      const mockHotTakeId = "hottake123";

      // Mock reviewer document
      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({reviewer: true, displayName: "Reviewer"}),
        })
        // Mock needsReview document
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            text: "Test hot take",
            userId: "user123",
            status: "pending_review",
          }),
          ref: {delete: mockDelete},
        });

      const request = {
        auth: {uid: mockReviewerId},
        data: {hotTakeId: mockHotTakeId},
      };

      // @ts-ignore - Mock request object
      const result = await approveHotTakeHandler(request);

      expect(result.success).toBe(true);
      expect(mockSet).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should reject non-reviewers", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({reviewer: false}),
      });

      const request = {
        auth: {uid: "user123"},
        data: {hotTakeId: "hottake123"},
      };

      // @ts-ignore - Mock request object
      await expect(approveHotTakeHandler(request)).rejects.toThrow(
        "not authorized as a reviewer"
      );
    });
  });

  describe("rejectHotTake", () => {
    it("should reject a hot take when user is a reviewer", async () => {
      const mockReviewerId = "reviewer123";
      const mockHotTakeId = "hottake123";

      // Mock reviewer document
      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({reviewer: true, displayName: "Reviewer"}),
        })
        // Mock needsReview document
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            text: "Test hot take",
            userId: "user123",
            status: "pending_review",
          }),
          ref: {delete: mockDelete},
        });

      const request = {
        auth: {uid: mockReviewerId},
        data: {hotTakeId: mockHotTakeId, reason: "Inappropriate content"},
      };

      // @ts-ignore - Mock request object
      const result = await rejectHotTakeHandler(request);

      expect(result.success).toBe(true);
      expect(mockSet).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("getPendingReviews", () => {
    it("should return pending reviews for reviewers", async () => {
      const mockReviewerId = "reviewer123";

      // Mock reviewer document
      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({reviewer: true}),
        })
        // Mock pending reviews query
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: "hottake1",
              data: () => ({text: "Hot take 1", status: "pending_review"}),
            },
            {
              id: "hottake2",
              data: () => ({text: "Hot take 2", status: "pending_review"}),
            },
          ],
        });

      const request = {
        auth: {uid: mockReviewerId},
        data: {},
      };

      // @ts-ignore - Mock request object
      const result = await getPendingReviewsHandler(request);

      expect(result.success).toBe(true);
      expect(result.reviews).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it("should reject non-reviewers", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({reviewer: false}),
      });

      const request = {
        auth: {uid: "user123"},
        data: {},
      };

      // @ts-ignore - Mock request object
      await expect(getPendingReviewsHandler(request)).rejects.toThrow(
        "not authorized as a reviewer"
      );
    });
  });

  describe("getMyHotTakes", () => {
    it("should return user's hot takes", async () => {
      const mockUserId = "user123";

      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "hottake1",
            data: () => ({
              text: "My hot take 1",
              userId: mockUserId,
              status: "approved",
            }),
          },
          {
            id: "hottake2",
            data: () => ({
              text: "My hot take 2",
              userId: mockUserId,
              status: "approved",
            }),
          },
        ],
      });

      const request = {
        auth: {uid: mockUserId},
        data: {limit: 20},
      };

      // @ts-ignore - Mock request object
      const result = await getMyHotTakesHandler(request);

      expect(result.success).toBe(true);
      expect(result.hotTakes).toHaveLength(2);
    });
  });

  describe("getHotTakes", () => {
    it("should return approved hot takes", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "hottake1",
            data: () => ({
              text: "Hot take 1",
              status: "approved",
            }),
          },
          {
            id: "hottake2",
            data: () => ({
              text: "Hot take 2",
              status: "approved",
            }),
          },
        ],
      });

      const request = {
        data: {limit: 20},
      };

      // @ts-ignore - Mock request object
      const result = await getHotTakesHandler(request);

      expect(result.success).toBe(true);
      expect(result.hotTakes).toHaveLength(2);
    });
  });
});

describe("Toxicity Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should analyze toxicity correctly", async () => {
    const mockResults = [
      {label: "toxicity", match: true, probability: 0.85},
      {label: "insult", match: false, probability: 0.3},
    ];

    (analyzeToxicity as jest.Mock).mockResolvedValue(mockResults);

    const results = await analyzeToxicity("This is a test");

    expect(results).toEqual(mockResults);
    expect(analyzeToxicity).toHaveBeenCalledWith("This is a test");
  });

  it("should detect toxic content", () => {
    const results = [
      {label: "toxicity", match: true, probability: 0.85},
      {label: "insult", match: false, probability: 0.3},
    ];

    (hasToxicContent as jest.Mock).mockReturnValue(true);

    const isToxic = hasToxicContent(results);

    expect(isToxic).toBe(true);
  });

  it("should get max toxicity probability", () => {
    const results = [
      {label: "toxicity", match: true, probability: 0.85},
      {label: "insult", match: false, probability: 0.3},
    ];

    (getMaxToxicityProbability as jest.Mock).mockReturnValue(0.85);

    const maxProb = getMaxToxicityProbability(results);

    expect(maxProb).toBe(0.85);
  });
});

