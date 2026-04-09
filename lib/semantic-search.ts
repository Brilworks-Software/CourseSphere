/**
 * Semantic Search Service using pgvector in Supabase
 * Searches for relevant transcript chunks based on semantic similarity
 */

import { createClient } from "@supabase/supabase-js";
import { generateQueryEmbedding } from "./embedding-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

export interface SearchResult {
  id: string;
  chunkText: string;
  transcriptId: string;
  lessonId: string | null;
  courseId: string | null;
  chunkOrder: number;
  similarityScore: number;
  wordCount: number;
}

export interface SearchResultsWithMetadata {
  results: SearchResult[];
  queryEmbedded: boolean;
  totalResults: number;
  executionTimeMs: number;
}

/**
 * Search for relevant transcript chunks based on semantic similarity
 * Uses pgvector with cosine distance for efficient vector search
 *
 * @param query - User query to search for
 * @param courseId - Filter by course (optional, but recommended for scope)
 * @param limit - Maximum number of results to return (default 5)
 * @param similarityThreshold - Minimum similarity score (0-1, default 0.5)
 * @returns Array of relevant chunks ranked by similarity
 */
export async function searchRelevantChunks(
  query: string,
  courseId?: string,
  limit: number = 5,
  similarityThreshold: number = 0.5,
): Promise<SearchResultsWithMetadata> {
  const startTime = Date.now();

  try {
    // 1. Generate embedding for the user query
    const queryEmbedding = await generateQueryEmbedding(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.error("Failed to generate query embedding");
      return {
        results: [],
        queryEmbedded: false,
        totalResults: 0,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 2. Execute pgvector similarity search
    // Convert embedding array to Postgres vector format: "[val1, val2, ...]"
    const embeddingString = `[${queryEmbedding.join(",")}]`;

    let query_builder = supabase.from("transcript_chunks").select(
      `
        id,
        chunk_text,
        transcript_id,
        lesson_id,
        course_id,
        chunk_order,
        word_count,
        embedding
      `,
      { count: "exact" },
    );

    // Add course filter if provided (recommended for performance)
    if (courseId) {
      query_builder = query_builder.eq("course_id", courseId);
    }

    // For pgvector similarity, Supabase uses the <-> operator for distance
    // We need to use raw SQL for this operation
    const { data, error, count } = await supabase.rpc(
      "search_transcript_chunks",
      {
        query_embedding: queryEmbedding,
        course_filter: courseId,
        similarity_threshold: similarityThreshold,
        limit_results: limit,
      },
    );

    if (error) {
      // Fallback: if RPC not available, do approximate search with regular query
      console.warn("RPC search failed, using approximate search", error);
      return await searchRelevantChunksApproximate(
        queryEmbedding,
        courseId,
        limit,
        similarityThreshold,
        startTime,
      );
    }

    if (!data) {
      return {
        results: [],
        queryEmbedded: true,
        totalResults: 0,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Transform results
    const results: SearchResult[] = data.map((row: any) => ({
      id: row.id,
      chunkText: row.chunk_text,
      transcriptId: row.transcript_id,
      lessonId: row.lesson_id,
      courseId: row.course_id,
      chunkOrder: row.chunk_order,
      similarityScore: row.similarity_score,
      wordCount: row.word_count,
    }));

    return {
      results,
      queryEmbedded: true,
      totalResults: results.length,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("Error in searchRelevantChunks:", error);
    return {
      results: [],
      queryEmbedded: false,
      totalResults: 0,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Approximate search fallback using SQL (when pgvector RPC not available)
 * Searches by filtering chunks and calculating similarity in application layer
 * Less efficient but works with standard Supabase setup
 */
async function searchRelevantChunksApproximate(
  queryEmbedding: number[],
  courseId: string | undefined,
  limit: number,
  similarityThreshold: number,
  startTime: number,
): Promise<SearchResultsWithMetadata> {
  try {
    let query_builder = supabase
      .from("transcript_chunks")
      .select("*")
      .not("embedding", "is", null);

    if (courseId) {
      query_builder = query_builder.eq("course_id", courseId);
    }

    const { data, error } = await query_builder;

    if (error || !data) {
      console.error("Failed to fetch chunks for approximate search:", error);
      return {
        results: [],
        queryEmbedded: true,
        totalResults: 0,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Calculate similarity scores in application
    const scored = data
      .map((chunk: any) => {
        // Parse embedding if stored as string
        let embedding = chunk.embedding;
        if (typeof embedding === "string") {
          embedding = JSON.parse(embedding);
        }

        const similarity = cosineSimilarity(queryEmbedding, embedding);

        return {
          id: chunk.id,
          chunkText: chunk.chunk_text,
          transcriptId: chunk.transcript_id,
          lessonId: chunk.lesson_id,
          courseId: chunk.course_id,
          chunkOrder: chunk.chunk_order,
          similarityScore: similarity,
          wordCount: chunk.word_count,
        };
      })
      .filter((item) => item.similarityScore >= similarityThreshold)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return {
      results: scored,
      queryEmbedded: true,
      totalResults: scored.length,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("Approximate search error:", error);
    return {
      results: [],
      queryEmbedded: true,
      totalResults: 0,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param vec1 - First vector (query embedding)
 * @param vec2 - Second vector (chunk embedding)
 * @returns Similarity score between -1 and 1 (higher is more similar)
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
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
 * Fetch nearby chunks in same lesson for context reconstruction
 * When a relevant chunk is found, also fetch surrounding chunks for additional context
 *
 * @param chunkId - The primary chunk ID
 * @param lessonId - The lesson ID
 * @param contextBefore - Number of chunks before to fetch
 * @param contextAfter - Number of chunks after to fetch
 * @returns Array of chunks in order
 */
export async function fetchChunkContext(
  chunkId: string,
  lessonId: string,
  contextBefore: number = 1,
  contextAfter: number = 1,
): Promise<SearchResult[]> {
  try {
    // First, get the order of the primary chunk
    const { data: primaryChunk, error: primaryError } = await supabase
      .from("transcript_chunks")
      .select("chunk_order")
      .eq("id", chunkId)
      .single();

    if (primaryError || !primaryChunk) {
      console.error("Failed to find primary chunk:", primaryError);
      return [];
    }

    const chunkOrder = primaryChunk.chunk_order;
    const startOrder = Math.max(0, chunkOrder - contextBefore);
    const endOrder = chunkOrder + contextAfter;

    // Fetch context chunks
    const { data: contextChunks, error: contextError } = await supabase
      .from("transcript_chunks")
      .select("*")
      .eq("lesson_id", lessonId)
      .gte("chunk_order", startOrder)
      .lte("chunk_order", endOrder)
      .order("chunk_order", { ascending: true });

    if (contextError || !contextChunks) {
      console.error("Failed to fetch context chunks:", contextError);
      return [];
    }

    return contextChunks.map((chunk: any) => ({
      id: chunk.id,
      chunkText: chunk.chunk_text,
      transcriptId: chunk.transcript_id,
      lessonId: chunk.lesson_id,
      courseId: chunk.course_id,
      chunkOrder: chunk.chunk_order,
      similarityScore: chunk.id === chunkId ? 1 : 0.5, // Primary chunk has score 1
      wordCount: chunk.word_count,
    }));
  } catch (error: any) {
    console.error("Error fetching chunk context:", error);
    return [];
  }
}

/**
 * Get embedding statistics for debugging/monitoring
 * @param courseId - Optional filter by course
 * @returns Statistics about embeddings in the system
 */
export async function getEmbeddingStats(courseId?: string): Promise<{
  totalChunks: number;
  embeddedChunks: number;
  unembeddedChunks: number;
  averageChunkSize: number;
  averageSimilarityScore: number;
}> {
  try {
    let query = supabase.from("transcript_chunks").select("*");

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("Failed to get embedding stats:", error);
      return {
        totalChunks: 0,
        embeddedChunks: 0,
        unembeddedChunks: 0,
        averageChunkSize: 0,
        averageSimilarityScore: 0,
      };
    }

    const totalChunks = data.length;
    const embeddedChunks = data.filter((c: any) => c.embedding).length;
    const unembeddedChunks = totalChunks - embeddedChunks;
    const averageChunkSize =
      totalChunks > 0
        ? Math.round(
            data.reduce((sum: number, c: any) => sum + (c.word_count || 0), 0) /
              totalChunks,
          )
        : 0;

    return {
      totalChunks,
      embeddedChunks,
      unembeddedChunks,
      averageChunkSize,
      averageSimilarityScore: 0, // Would require averaging from search results
    };
  } catch (error: any) {
    console.error("Error calculating embedding stats:", error);
    return {
      totalChunks: 0,
      embeddedChunks: 0,
      unembeddedChunks: 0,
      averageChunkSize: 0,
      averageSimilarityScore: 0,
    };
  }
}
