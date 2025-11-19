import * as toxicity from "@tensorflow-models/toxicity";
import "@tensorflow/tfjs-node";

/**
 * Toxicity detection result for a single category
 */
export interface ToxicityResult {
  label: string;
  match: boolean;
  probability: number;
}

/**
 * Global model instance to cache between invocations
 */
let modelInstance: toxicity.ToxicityClassifier | null = null;
let modelLoadingPromise: Promise<toxicity.ToxicityClassifier> | null = null;

/**
 * Minimum threshold for toxicity detection (0-1)
 * Lower values = more sensitive, higher values = less sensitive
 */
const TOXICITY_THRESHOLD = 0.8;

/**
 * Load the toxicity model (cached globally)
 * This function is safe to call multiple times - it will reuse the cached model
 */
async function loadModel(): Promise<toxicity.ToxicityClassifier> {
  // Return cached model if already loaded
  if (modelInstance) {
    console.log("Using cached toxicity model");
    return modelInstance;
  }

  // If model is currently loading, wait for that promise
  if (modelLoadingPromise) {
    console.log("Waiting for in-progress model load");
    return modelLoadingPromise;
  }

  // Start loading the model
  console.log("Loading toxicity model with threshold:", TOXICITY_THRESHOLD);
  modelLoadingPromise = toxicity.load(TOXICITY_THRESHOLD, []);

  try {
    modelInstance = await modelLoadingPromise;
    console.log("Toxicity model loaded successfully");
    return modelInstance;
  } catch (error) {
    // Reset loading promise on error so we can retry
    modelLoadingPromise = null;
    console.error("Error loading toxicity model:", error);
    throw error;
  }
}

/**
 * Analyze text for toxicity
 * @param {string} text - The text to analyze
 * @returns {Promise<ToxicityResult[]>} Array of toxicity results for each category
 */
export async function analyzeToxicity(text: string): Promise<ToxicityResult[]> {
  if (!text || text.trim().length === 0) {
    console.log("Empty text provided to toxicity analyzer");
    return [];
  }

  try {
    const model = await loadModel();
    const predictions = await model.classify([text]);

    const results: ToxicityResult[] = predictions.map((prediction) => {
      const match = prediction.results[0].match;
      const probabilities = prediction.results[0].probabilities;

      // probabilities is a Float32Array with [probability_negative, probability_positive]
      // We ALWAYS want the positive (toxic) probability, regardless of match
      const toxicProbability = probabilities[1];

      return {
        label: prediction.label,
        match: match ?? false,
        probability: Number(toxicProbability.toFixed(4)),
      };
    });

    console.log("Toxicity analysis complete:", {
      textLength: text.length,
      resultsCount: results.length,
      matchedCategories: results.filter((r) => r.match).map((r) => r.label),
    });

    return results;
  } catch (error) {
    console.error("Error analyzing toxicity:", error);
    throw error;
  }
}

/**
 * Check if any toxicity category has a match
 * @param {ToxicityResult[]} results - Toxicity analysis results
 * @returns {boolean} true if any category matched as toxic
 */
export function hasToxicContent(results: ToxicityResult[]): boolean {
  return results.some((result) => result.match);
}

/**
 * Get the highest toxicity probability from results
 * @param {ToxicityResult[]} results - Toxicity analysis results
 * @returns {number} Maximum probability value (0-1)
 */
export function getMaxToxicityProbability(results: ToxicityResult[]): number {
  if (results.length === 0) return 0;
  return Math.max(...results.map((r) => r.probability));
}

/**
 * Get all matched toxic categories
 * @param {ToxicityResult[]} results - Toxicity analysis results
 * @returns {string[]} Array of matched category labels
 */
export function getMatchedCategories(results: ToxicityResult[]): string[] {
  return results.filter((r) => r.match).map((r) => r.label);
}

/**
 * Get the toxicity threshold used by the model
 * @returns {number} The toxicity threshold
 */
export function getToxicityThreshold(): number {
  return TOXICITY_THRESHOLD;
}

