import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  chunkTranscriptBySemantic,
  TranscriptChunk,
} from "@/lib/transcript-chunking";
import { generateBatchEmbeddings } from "@/lib/embedding-service";

export async function GET() {
  const supabase = await createClient();

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const { data: jobs } = await supabase
    .from("video_transcription_jobs")
    .select("*")
    .eq("status", "pending")
    .limit(3);

  if (!jobs?.length) {
    return NextResponse.json({ message: "No jobs" });
  }

  for (const job of jobs) {
    try {
      console.log(
        `[transcription] Starting job id=${job.id} aws_asset_id=${job.aws_asset_id} lesson_id=${job.lesson_id} course_id=${job.course_id}`,
      );

      // mark processing
      await supabase
        .from("video_transcription_jobs")
        .update({ status: "processing" })
        .eq("id", job.id);
      console.log(`[transcription] Marked job id=${job.id} as processing`);

      // fetch the aws asset record so we can generate a presigned download URL
      const { data: asset, error: assetError } = await supabase
        .from("aws_assets")
        .select("asset_key, bucket_name")
        .eq("id", job.aws_asset_id)
        .single();

      if (assetError || !asset?.asset_key) {
        throw new Error(
          `Asset not found for id=${job.aws_asset_id}: ${assetError?.message}`,
        );
      }

      const command = new GetObjectCommand({
        Bucket: asset.bucket_name ?? process.env.AWS_S3_BUCKET!,
        Key: asset.asset_key,
      });

      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 600000 });
      console.log(
        `[transcription] Generated presigned URL for asset=${asset.asset_key} (bucket=${asset.bucket_name})`,
      );

      // call the python transcribe API with the presigned download URL (matches your curl)
      console.log(
        `[transcription] POSTing signed URL to TRANSCRIBE_API for job=${job.id}`,
      );
      const res = await fetch(process.env.TRANSCRIBE_API!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url: signedUrl }),
      });

      const raw = await res.text();
      let responseJson: any = null;
      try {
        responseJson = raw ? JSON.parse(raw) : null;
      } catch (parseErr) {
        console.error(
          `[transcription] Failed to parse TRANSCRIBE_API response for job=${job.id}`,
          parseErr,
        );
        console.error(`[transcription] Raw response for job=${job.id}:`, raw);
      }

      console.log(
        `[transcription] TRANSCRIBE_API responded with status=${res.status} for job=${job.id}`,
      );
      console.log(
        `[transcription] TRANSCRIBE_API response body for job=${job.id}:`,
        responseJson,
      );

      const transcript = responseJson?.transcript ?? null;

      // log embedding information if present in the response
      const embeddingPresent = !!(
        responseJson?.embeddings ||
        responseJson?.embedding ||
        responseJson?.embedding_generated ||
        responseJson?.embedding_status ||
        responseJson?.embeddingStatus
      );
      if (embeddingPresent) {
        console.log(
          `[transcription] Embedding present for job=${job.id}`,
          responseJson.embeddings
            ? `embeddings.length=${responseJson.embeddings.length}`
            : undefined,
        );
      } else {
        console.log(
          `[transcription] No embedding info returned for job=${job.id}`,
        );
      }

      // save transcript
      if (transcript) {
        const { data: transcriptRow, error: transcriptError } = await supabase
          .from("lesson_transcripts")
          .insert({
            lesson_id: job.lesson_id,
            transcript_text: transcript,
          })
          .select()
          .single();

        if (transcriptError) {
          console.error(
            `[transcription] Failed to insert transcript for job=${job.id}:`,
            transcriptError,
          );
        } else {
          console.log(
            `[transcription] Saved transcript id=${transcriptRow?.id ?? "unknown"} for lesson=${job.lesson_id}`,
          );

          // PHASE 2: Generate chunks and embeddings
          try {
            console.log(
              `[transcription] Starting chunking/embedding pipeline for job=${job.id}`,
            );

            // Step 1: Create video_transcripts record if it doesn't exist
            let videoTranscriptId = null;
            const { data: existingTranscript } = await supabase
              .from("video_transcripts")
              .select("id")
              .eq("s3_bucket", asset.bucket_name)
              .eq("s3_key", asset.asset_key)
              .single();

            if (!existingTranscript) {
              const { data: vtRow, error: vtError } = await supabase
                .from("video_transcripts")
                .insert({
                  s3_bucket: asset.bucket_name,
                  s3_key: asset.asset_key,
                  transcript: transcript,
                  status: "completed",
                })
                .select()
                .single();

              if (vtError) {
                console.error(
                  `[transcription] Failed to insert video_transcript for job=${job.id}:`,
                  vtError,
                );
              } else {
                videoTranscriptId = vtRow?.id;
                console.log(
                  `[transcription] Created video_transcript id=${videoTranscriptId} for job=${job.id}`,
                );
              }
            } else {
              videoTranscriptId = existingTranscript.id;
            }

            if (!videoTranscriptId) {
              throw new Error("Failed to get or create video_transcript");
            }

            // Step 2: Chunk the transcript
            const chunks = chunkTranscriptBySemantic(transcript);
            console.log(
              `[transcription] Generated ${chunks.length} chunks for job=${job.id}`,
            );

            if (chunks.length === 0) {
              throw new Error("Chunking produced no chunks");
            }

            // Step 3: Generate embeddings for all chunks
            const chunkTexts = chunks.map((c) => c.text);
            console.log(
              `[transcription] Starting embedding generation for ${chunkTexts.length} chunks...`,
            );
            const embeddingResult = await generateBatchEmbeddings(chunkTexts);
            console.log(
              `[transcription] Embedding generation complete: ${embeddingResult.success} succeeded, ${embeddingResult.failed} failed`,
            );

            if (embeddingResult.success === 0) {
              throw new Error("Failed to generate any embeddings");
            }

            // Step 4: Insert chunks with embeddings into transcript_chunks table
            const chunksToInsert = chunks
              .map((chunk, index) => {
                const embedding = embeddingResult.embeddings[index];
                if (!embedding) {
                  console.warn(
                    `[transcription] Missing embedding for chunk ${index}`,
                  );
                  return null;
                }

                return {
                  transcript_id: videoTranscriptId,
                  lesson_id: job.lesson_id,
                  course_id: job.course_id,
                  chunk_text: chunk.text,
                  chunk_order: chunk.chunkOrder,
                  char_start_position: chunk.charStartPosition,
                  char_end_position: chunk.charEndPosition,
                  embedding: embedding.embedding, // The 768-dim vector
                  word_count: chunk.wordCount,
                };
              })
              .filter((c) => c !== null);

            if (chunksToInsert.length === 0) {
              throw new Error("No valid chunks to insert");
            }

            console.log(
              `[transcription] Inserting ${chunksToInsert.length} chunks into transcript_chunks...`,
            );

            // Insert in batches to avoid payload size limits
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
                  `[transcription] Failed to insert chunk batch for job=${job.id}:`,
                  insertError,
                );
                throw insertError;
              }

              console.log(
                `[transcription] Inserted batch of ${batch.length} chunks (${i + batch.length}/${chunksToInsert.length})`,
              );
            }

            console.log(
              `[transcription] Successfully inserted all ${chunksToInsert.length} chunks for job=${job.id}`,
            );

            // Step 5: Update job status to mark chunks_generated and embeddings_generated
            await supabase
              .from("video_transcription_jobs")
              .update({
                chunks_generated: true,
                embedding_generated: embeddingResult.success > 0,
                chunks_count: chunksToInsert.length,
                last_chunked_at: new Date().toISOString(),
              })
              .eq("id", job.id);

            console.log(
              `[transcription] Updated job ${job.id}: chunks_generated=true, embeddings_generated=${embeddingResult.success > 0}, chunks_count=${chunksToInsert.length}`,
            );
          } catch (chunkingError) {
            console.error(
              `[transcription] Chunking/embedding pipeline failed for job=${job.id}:`,
              chunkingError,
            );
            // Don't fail the entire job, just mark chunks_generated as false
            await supabase
              .from("video_transcription_jobs")
              .update({
                chunks_generated: false,
                embedding_generated: false,
                error_message: `Chunking/embedding error: ${String(chunkingError)}`,
              })
              .eq("id", job.id);
          }
        }
      } else {
        console.warn(
          `[transcription] No transcript returned for job=${job.id}`,
        );
      }

      // mark done
      await supabase
        .from("video_transcription_jobs")
        .update({
          status: "completed",
          transcript_generated: !!transcript,
        })
        .eq("id", job.id);

      console.log(
        `[transcription] Job ${job.id} completed (transcript_generated=${!!transcript})`,
      );
    } catch (err) {
      console.error(`[transcription] Error processing job ${job.id}:`, err);
      await supabase
        .from("video_transcription_jobs")
        .update({
          status: "failed",
          error_message: String(err),
        })
        .eq("id", job.id);
    }
  }

  return NextResponse.json({ success: true });
}
