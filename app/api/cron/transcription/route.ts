import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
        `[transcription] Job ${job.id} completed (transcript_generated=${!!transcript}, embedding_present=${embeddingPresent})`,
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
