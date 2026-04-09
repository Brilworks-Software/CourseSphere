/**
 * Admin API Endpoint: Regenerate Embeddings
 * Allows regenerating transcript chunks and embeddings for a course or lesson
 * Useful for bulk operations, API key updates, or fixing failed embeddings
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import {
  chunkTranscriptBySemantic,
  TranscriptChunk,
} from "@/lib/transcript-chunking";
import { generateBatchEmbeddings } from "@/lib/embedding-service";

interface RegenerateRequest {
  courseId?: string;
  lessonId?: string;
}

interface RegenerateStats {
  processed: number;
  succeeded: number;
  failed: number;
  totalVectors: number;
  totalChunks: number;
  executionTimeMs: number;
}

/**
 * Verify admin authorization
 * In production, implement proper auth check (JWT token, API key, etc.)
 */
function verifyAdminAuth(request: Request): boolean {
  // TODO: Implement proper admin auth check
  // For now, check for Authorization header with admin key
  const authHeader = request.headers.get("Authorization");
  const adminKey = "supersecret";

  if (!adminKey || !authHeader) {
    return false;
  }

  return authHeader === `Bearer ${adminKey}`;
}

export async function POST(request: Request) {
  try {
    // Check admin authorization
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 },
      );
    }

    const body: RegenerateRequest = await request.json();
    const { courseId, lessonId } = body;

    if (!courseId && !lessonId) {
      return NextResponse.json(
        {
          error: "Either courseId or lessonId must be provided",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const startTime = Date.now();
    const stats: RegenerateStats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      totalVectors: 0,
      totalChunks: 0,
      executionTimeMs: 0,
    };

    console.log(
      `[regenerate-embeddings] Starting regeneration: courseId=${courseId}, lessonId=${lessonId}`,
    );

    // Step 1: Fetch video_transcripts to regenerate based on course or lesson
    let transcripts: any[] = [];

    /**
     * Helper to extract filename base without extension
     */
    function extractFileBase(path: string): string {
      const filename = path.split("/").pop() || path;
      const lastDot = filename.lastIndexOf(".");
      if (lastDot === -1) return filename; // no extension, return full filename
      return filename.substring(0, lastDot);
    }

    if (lessonId) {
      // Get AWS assets for this specific lesson
      const { data: assets, error: assetError } = await supabase
        .from("aws_assets")
        .select("*")
        .eq("related_lesson_id", lessonId);

      if (assetError || !assets || assets.length === 0) {
        return NextResponse.json(
          { error: "Lesson not found or has no video assets" },
          { status: 404 },
        );
      }

      // Fetch transcripts matching these assets
      for (const asset of assets) {
        const assetBase = extractFileBase(asset.asset_key);
        const assetBaseLog = assetBase || "(empty)";
        console.log(
          `[regenerate-embeddings] Checking asset: ${asset.asset_key} (bucket=${asset.bucket_name}) -> base='${assetBaseLog}'`,
        );

        const { data: matchedTranscripts, error: transcriptError } =
          await supabase
            .from("video_transcripts")
            .select("*")
            .eq("s3_bucket", asset.bucket_name)
            .eq("status", "completed")
            .not("transcript", "is", null);

        if (transcriptError) {
          console.error(
            `[regenerate-embeddings] Error fetching transcripts (filtered):`,
            transcriptError,
          );
          continue;
        }

        let matchedForAsset = false;
        console.log(
          `[regenerate-embeddings] Fetched ${matchedTranscripts?.length ?? 0} completed transcripts with non-null text from bucket ${asset.bucket_name}`,
        );

        // Diagnostic: also fetch all transcripts in this bucket (including nulls / other statuses)
        const { data: allTranscripts, error: allTranscriptsError } =
          await supabase
            .from("video_transcripts")
            .select("*")
            .eq("s3_bucket", asset.bucket_name);

        if (allTranscriptsError) {
          console.error(
            `[regenerate-embeddings] Error fetching all transcripts for diagnostics:`,
            allTranscriptsError,
          );
        } else {
          const totalCount = allTranscripts?.length ?? 0;
          const completedCount = (allTranscripts ?? []).filter(
            (x) => x.status === "completed",
          ).length;
          const completedWithTextCount = (allTranscripts ?? []).filter(
            (x) => x.status === "completed" && x.transcript,
          ).length;
          const completedWithoutTextCount =
            completedCount - completedWithTextCount;
          const sampleList = (allTranscripts ?? []).slice(0, 10).map((x) => ({
            id: x.id,
            s3_key: x.s3_key,
            status: x.status,
            transcriptPresent: !!x.transcript,
            transcriptLength: x.transcript ? x.transcript.length : 0,
          }));

          console.log(
            `[regenerate-embeddings] Diagnostics for bucket='${asset.bucket_name}': total=${totalCount}, completed=${completedCount}, completedWithText=${completedWithTextCount}, completedWithoutText=${completedWithoutTextCount}, sample=${JSON.stringify(sampleList)}`,
          );
        }

        if (matchedTranscripts) {
          const normalizedAssetBase = (assetBase || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          for (const t of matchedTranscripts) {
            const transcriptBase = extractFileBase(t.s3_key) || "(empty)";
            const normalizedTranscriptBase = transcriptBase
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            console.log(
              `[regenerate-embeddings] Comparing assetBase='${assetBaseLog}' with transcript='${t.s3_key}' -> transcriptBase='${transcriptBase}' (id=${t.id})`,
            );

            const exactMatch = transcriptBase === assetBase;
            const fuzzyMatch =
              normalizedTranscriptBase === normalizedAssetBase ||
              transcriptBase.includes(assetBase) ||
              assetBase.includes(transcriptBase);

            if (exactMatch || fuzzyMatch) {
              console.log(
                `[regenerate-embeddings] ${fuzzyMatch && !exactMatch ? "Fuzzy match" : "Matched"} transcript ${t.id} to asset ${asset.asset_key} (transcriptBase='${transcriptBase}')`,
              );
              transcripts.push(t);
              matchedForAsset = true;
              break;
            }
          }
        }

        if (!matchedForAsset) {
          console.warn(
            `[regenerate-embeddings] No matching transcript found for asset ${asset.asset_key} (assetBase='${assetBaseLog}') in bucket ${asset.bucket_name}`,
          );

          if (Array.isArray(allTranscripts) && allTranscripts.length > 0) {
            const bases = allTranscripts.slice(0, 20).map((x) => ({
              id: x.id,
              s3_key: x.s3_key,
              status: x.status,
              transcriptPresent: !!x.transcript,
            }));
            console.log(
              `[regenerate-embeddings] Transcript samples (first 20) in bucket ${asset.bucket_name}: ${JSON.stringify(bases)}`,
            );
          }
        }
      }

      if (transcripts.length === 0) {
        return NextResponse.json(
          { error: "Lesson not found or has no completed transcripts" },
          { status: 404 },
        );
      }
    } else if (courseId) {
      // Get all lessons for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId);

      if (lessonsError || !lessons || lessons.length === 0) {
        return NextResponse.json(
          { error: "Course not found or has no lessons" },
          { status: 404 },
        );
      }

      // Get all AWS assets for lessons in this course
      const { data: assets, error: assetsError } = await supabase
        .from("aws_assets")
        .select("*")
        .in(
          "related_lesson_id",
          lessons.map((l) => l.id),
        );

      if (assetsError) {
        console.error("Error fetching assets:", assetsError);
        return NextResponse.json(
          { error: `Failed to fetch assets: ${assetsError.message}` },
          { status: 500 },
        );
      }

      if (!assets || assets.length === 0) {
        return NextResponse.json(
          { error: "Course has no video assets" },
          { status: 404 },
        );
      }

      // Fetch transcripts matching these assets
      for (const asset of assets) {
        const assetBase = extractFileBase(asset.asset_key);
        const assetBaseLog = assetBase || "(empty)";
        console.log(
          `[regenerate-embeddings] Checking asset: ${asset.asset_key} (bucket=${asset.bucket_name}) -> base='${assetBaseLog}'`,
        );

        const { data: matchedTranscripts, error: transcriptError } =
          await supabase
            .from("video_transcripts")
            .select("*")
            .eq("s3_bucket", asset.bucket_name)
            .eq("status", "completed")
            .not("transcript", "is", null);

        if (transcriptError) {
          console.error(
            `[regenerate-embeddings] Error fetching transcripts (filtered):`,
            transcriptError,
          );
          continue;
        }

        let matchedForAsset = false;
        console.log(
          `[regenerate-embeddings] Fetched ${matchedTranscripts?.length ?? 0} completed transcripts with non-null text from bucket ${asset.bucket_name}`,
        );

        // Diagnostic: also fetch all transcripts in this bucket (including nulls / other statuses)
        const { data: allTranscripts, error: allTranscriptsError } =
          await supabase
            .from("video_transcripts")
            .select("*")
            .eq("s3_bucket", asset.bucket_name);

        if (allTranscriptsError) {
          console.error(
            `[regenerate-embeddings] Error fetching all transcripts for diagnostics:`,
            allTranscriptsError,
          );
        } else {
          const totalCount = allTranscripts?.length ?? 0;
          const completedCount = (allTranscripts ?? []).filter(
            (x) => x.status === "completed",
          ).length;
          const completedWithTextCount = (allTranscripts ?? []).filter(
            (x) => x.status === "completed" && x.transcript,
          ).length;
          const completedWithoutTextCount =
            completedCount - completedWithTextCount;
          const sampleList = (allTranscripts ?? []).slice(0, 10).map((x) => ({
            id: x.id,
            s3_key: x.s3_key,
            status: x.status,
            transcriptPresent: !!x.transcript,
            transcriptLength: x.transcript ? x.transcript.length : 0,
          }));

          console.log(
            `[regenerate-embeddings] Diagnostics for bucket='${asset.bucket_name}': total=${totalCount}, completed=${completedCount}, completedWithText=${completedWithTextCount}, completedWithoutText=${completedWithoutTextCount}, sample=${JSON.stringify(sampleList)}`,
          );
        }

        if (matchedTranscripts) {
          const normalizedAssetBase = (assetBase || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          for (const t of matchedTranscripts) {
            const transcriptBase = extractFileBase(t.s3_key) || "(empty)";
            const normalizedTranscriptBase = transcriptBase
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            console.log(
              `[regenerate-embeddings] Comparing assetBase='${assetBaseLog}' with transcript='${t.s3_key}' -> transcriptBase='${transcriptBase}' (id=${t.id})`,
            );

            const exactMatch = transcriptBase === assetBase;
            const fuzzyMatch =
              normalizedTranscriptBase === normalizedAssetBase ||
              transcriptBase.includes(assetBase) ||
              assetBase.includes(transcriptBase);

            if (exactMatch || fuzzyMatch) {
              console.log(
                `[regenerate-embeddings] ${fuzzyMatch && !exactMatch ? "Fuzzy match" : "Matched"} transcript ${t.id} to asset ${asset.asset_key} (transcriptBase='${transcriptBase}')`,
              );
              transcripts.push(t);
              matchedForAsset = true;
              break;
            }
          }
        }

        if (!matchedForAsset) {
          console.warn(
            `[regenerate-embeddings] No matching transcript found for asset ${asset.asset_key} (assetBase='${assetBaseLog}') in bucket ${asset.bucket_name}`,
          );

          if (Array.isArray(allTranscripts) && allTranscripts.length > 0) {
            const bases = allTranscripts.slice(0, 20).map((x) => ({
              id: x.id,
              s3_key: x.s3_key,
              status: x.status,
              transcriptPresent: !!x.transcript,
            }));
            console.log(
              `[regenerate-embeddings] Transcript samples (first 20) in bucket ${asset.bucket_name}: ${JSON.stringify(bases)}`,
            );
          }
        }
      }

      if (transcripts.length === 0) {
        return NextResponse.json(
          { error: "Course has no completed transcripts" },
          { status: 404 },
        );
      }
    }

    if (transcripts.length === 0) {
      return NextResponse.json(
        { error: "No transcripts found for regeneration" },
        { status: 404 },
      );
    }

    // Process all transcripts
    for (const transcript of transcripts) {
      if (!transcript.transcript) {
        console.warn(
          `[regenerate-embeddings] Skipping empty transcript: id=${transcript.id}, s3_key=${transcript.s3_key}, status=${transcript.status}, transcriptPresent=${!!transcript.transcript}`,
        );
        continue;
      }

      // Diagnostic preview: log only the first 10 characters of the transcript
      try {
        const preview = (transcript.transcript || "")
          .replace(/\s+/g, " ")
          .substring(0, 10);
        console.log(
          `[regenerate-embeddings] Transcript preview for id=${transcript.id}: "${preview}" (first 10 chars)`,
        );
      } catch (previewErr) {
        console.warn(
          `[regenerate-embeddings] Could not produce transcript preview for id=${transcript.id}: ${previewErr}`,
        );
      }

      try {
        // Determine lesson ID from the asset relationship
        let currentLessonId = lessonId;
        if (courseId && !lessonId) {
          // Find lesson ID from aws_assets for this transcript
          const { data: asset } = await supabase
            .from("aws_assets")
            .select("related_lesson_id")
            .eq("s3_bucket", transcript.s3_bucket)
            .eq("s3_key", transcript.s3_key)
            .single();

          if (asset) {
            currentLessonId = asset.related_lesson_id;
          }
        }

        await regenerateTranscriptEmbeddings(
          supabase,
          transcript,
          currentLessonId,
          courseId,
          stats,
        );
      } catch (error) {
        console.error(
          `[regenerate-embeddings] Failed to regenerate for transcript ${transcript.id}:`,
          error,
        );
        stats.failed++;
      }
    }

    stats.executionTimeMs = Date.now() - startTime;
    console.log(
      `[regenerate-embeddings] Completed: ${stats.succeeded}/${stats.processed} succeeded, ${stats.failed} failed, ${stats.totalChunks} chunks, ${stats.totalVectors} vectors in ${stats.executionTimeMs}ms`,
    );

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("[regenerate-embeddings] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Regenerate chunks and embeddings for a single transcript
 */
async function regenerateTranscriptEmbeddings(
  supabase: any,
  transcript: any,
  lessonId: string | undefined,
  courseId: string | undefined,
  stats: RegenerateStats,
): Promise<void> {
  stats.processed++;

  const transcriptId = transcript.id;
  const transcriptText = transcript.transcript;

  console.log(
    `[regenerate-embeddings] Processing transcript ${transcriptId} (lesson=${lessonId})...`,
  );

  // Delete existing chunks for this transcript
  const { error: deleteError } = await supabase
    .from("transcript_chunks")
    .delete()
    .eq("transcript_id", transcriptId);

  if (deleteError) {
    console.warn(
      `[regenerate-embeddings] Warning: Could not delete old chunks: ${deleteError.message}`,
    );
  }

  // Chunk the transcript
  const chunks = chunkTranscriptBySemantic(transcriptText);
  if (chunks.length === 0) {
    console.warn(
      `[regenerate-embeddings] No chunks generated for transcript ${transcriptId}`,
    );
    return;
  }

  console.log(
    `[regenerate-embeddings] Generated ${chunks.length} chunks for transcript ${transcriptId}`,
  );

  // Generate embeddings
  const chunkTexts = chunks.map((c) => c.text);
  const embeddingResult = await generateBatchEmbeddings(chunkTexts);

  console.log(
    `[regenerate-embeddings] Embedding generation: ${embeddingResult.success}/${chunkTexts.length} succeeded`,
  );

  if (embeddingResult.success === 0) {
    console.error(
      `[regenerate-embeddings] Failed to generate any embeddings for transcript ${transcriptId}`,
    );
    stats.failed++;
    return;
  }

  // Insert chunks with embeddings
  const chunksToInsert = chunks
    .map((chunk, index) => {
      const embedding = embeddingResult.embeddings[index];
      if (!embedding) {
        return null;
      }

      return {
        transcript_id: transcriptId,
        lesson_id: lessonId,
        course_id: courseId,
        chunk_text: chunk.text,
        chunk_order: chunk.chunkOrder,
        char_start_position: chunk.charStartPosition,
        char_end_position: chunk.charEndPosition,
        embedding: embedding.embedding,
      };
    })
    .filter((c) => c !== null);

  if (chunksToInsert.length === 0) {
    console.error(
      `[regenerate-embeddings] No valid chunks to insert for transcript ${transcriptId}`,
    );
    stats.failed++;
    return;
  }

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < chunksToInsert.length; i += batchSize) {
    const batch = chunksToInsert.slice(
      i,
      Math.min(i + batchSize, chunksToInsert.length),
    );
    const { error: insertError } = await supabase
      .from("transcript_chunks")
      .insert(batch);

    if (insertError) {
      console.error(
        `[regenerate-embeddings] Failed to insert chunk batch for transcript ${transcriptId}:`,
        insertError,
      );
      stats.failed++;
      return;
    }
  }

  stats.succeeded++;
  stats.totalChunks += chunksToInsert.length;
  stats.totalVectors += embeddingResult.success;

  console.log(
    `[regenerate-embeddings] Successfully regenerated transcript ${transcriptId}: ${chunksToInsert.length} chunks, ${embeddingResult.success} vectors`,
  );
}
