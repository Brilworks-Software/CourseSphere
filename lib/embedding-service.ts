/**
 * Embedding Service using Google Gemini API
 * Generates vector embeddings for transcript chunks with rate limiting and batching
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Allow overriding the embedding model via env var `GEMINI_EMBEDDING_MODEL`.
// If not set, keep the previous default for backward compatibility.
const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "models/gemini-embedding-001";

interface EmbeddingResult {
  text: string;
  embedding: number[];
}

interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  success: number;
  failed: number;
}

// Rate limiting: Gemini allows ~60 requests per minute for embeddings in free tier
// We'll batch requests to use ~40 per minute to be conservative
const BATCH_SIZE = 5; // Process 5 texts per batch
const BATCH_DELAY_MS = 1500; // Wait 1.5 seconds between batches (~40 per minute)
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate embedding for a single text using Gemini API with retry logic
 * @param text - The text to embed
 * @param retries - Current retry attempt
 * @returns Array of 3072 dimensions (Gemini's gemini-embedding-001 model)
 */
export async function generateSingleEmbedding(
  text: string,
  retries: number = 0,
): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    // gemini-embedding-001 returns 3072-dimensional vectors
    const result = await model.embedContent({
      content: {
        role: "user",
        parts: [
          {
            text,
          },
        ],
      },
    });

    if (result?.embedding?.values) {
      console.log("Embedding size:", result.embedding.values.length);
    }

    return result.embedding.values;
  } catch (error) {
    console.error(
      `Error generating embedding (attempt ${retries + 1}/${MAX_RETRIES}):`,
      (error as any)?.message ?? error,
    );

    if (retries < MAX_RETRIES) {
      const delayMs = RETRY_DELAY_MS * Math.pow(2, retries); // Exponential backoff
      console.log(`Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
      return generateSingleEmbedding(text, retries + 1);
    }

    return null;
  }
}

/**
 * Generate embeddings for multiple texts with batching and rate limiting
 * @param texts - Array of texts to embed
 * @returns Promise resolving to array of embeddings and stats
 */
export async function generateBatchEmbeddings(
  texts: string[],
): Promise<BatchEmbeddingResult> {
  const results: EmbeddingResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  // Process in batches to respect rate limits
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, Math.min(i + BATCH_SIZE, texts.length));

    // Wait between batches (except for the first batch)
    if (i > 0) {
      await sleep(BATCH_DELAY_MS);
    }

    console.log(
      `Processing embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} texts)`,
    );

    // Process each text in the batch sequentially to avoid rate limits
    for (const text of batch) {
      const embedding = await generateSingleEmbedding(text);

      if (embedding) {
        results.push({ text, embedding });
        successCount++;
      } else {
        failedCount++;
        console.warn(
          `Failed to generate embedding for text: "${text.substring(0, 50)}..."`,
        );
      }
    }
  }

  return {
    embeddings: results,
    success: successCount,
    failed: failedCount,
  };
}

/**
 * Generate embedding for user query (single text, prioritized)
 * Used in semantic search to find relevant chunks
 * @param query - The user query to embed
 * @returns Embedding vector or null on failure
 */
export async function generateQueryEmbedding(
  query: string,
): Promise<number[] | null> {
  try {
    // Ensure query is concise (Gemini has input limits)
    const truncatedQuery = query.substring(0, 1000);

    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const result = await model.embedContent({
      content: {
        role: "user",
        parts: [
          {
            text: truncatedQuery,
          },
        ],
      },
    });

    if (result?.embedding?.values) {
      console.log("Embedding size (query):", result.embedding.values.length);
    }

    return result.embedding.values;
  } catch (error) {
    console.error(
      "Error generating query embedding:",
      (error as any)?.message ?? error,
    );
    return null;
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Used to score semantic relevance (1 = perfect match, 0 = no similarity, -1 = opposite)
 * @param vec1 - First embedding vector
 * @param vec2 - Second embedding vector
 * @returns Cosine similarity score between -1 and 1
 */
export function calculateCosineSimilarity(
  vec1: number[],
  vec2: number[],
): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Validate that embeddings are properly formed
 * @param embeddings - Array of embeddings to validate
 * @returns Object with validation results
 */
export function validateEmbeddings(embeddings: number[][]): {
  isValid: boolean;
  expectedDimension: number;
  errors: string[];
} {
  const EXPECTED_DIMENSION = 3072; // gemini-embedding-001 dimension
  const errors: string[] = [];

  if (!Array.isArray(embeddings)) {
    errors.push("Embeddings must be an array");
    return { isValid: false, expectedDimension: EXPECTED_DIMENSION, errors };
  }

  if (embeddings.length === 0) {
    errors.push("Embeddings array is empty");
    return { isValid: false, expectedDimension: EXPECTED_DIMENSION, errors };
  }

  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];

    if (!Array.isArray(embedding)) {
      errors.push(`Embedding ${i} is not an array`);
      continue;
    }

    if (embedding.length !== EXPECTED_DIMENSION) {
      errors.push(
        `Embedding ${i} has wrong dimension: ${embedding.length} (expected ${EXPECTED_DIMENSION})`,
      );
      continue;
    }

    // Check that all values are numbers
    for (let j = 0; j < embedding.length; j++) {
      if (typeof embedding[j] !== "number" || isNaN(embedding[j])) {
        errors.push(
          `Embedding ${i}: Invalid value at index ${j}: ${embedding[j]}`,
        );
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    expectedDimension: EXPECTED_DIMENSION,
    errors,
  };
}
