import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processAWSAssetTranscript } from "@/lib/transcript-utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Cron job to sync transcripts from AWS
 * Fetches all AWS assets that are videos and tries to get their transcripts
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all AWS assets that are videos (by file type)
    const { data: awsAssets, error: assetsError } = await supabase
      .from("aws_assets")
      .select("id, bucket_name, asset_key, file_type, related_course_id")
      .in("file_type", ["video/mp4", "video/webm", "video/quicktime"]);

    if (assetsError) {
      return NextResponse.json(
        { error: "Failed to fetch AWS assets", details: assetsError },
        { status: 500 },
      );
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each video asset
    for (const asset of awsAssets || []) {
      try {
        // Check if transcript already exists for this asset
        const { data: existing } = await supabase
          .from("video_transcripts")
          .select("id, status")
          .eq("s3_bucket", asset.bucket_name)
          .eq("s3_key", asset.asset_key)
          .single();

        if (existing && existing.status === "completed") {
          results.skipped++;
          continue;
        }

        results.processed++;

        // Process transcript from AWS
        const success = await processAWSAssetTranscript(
          asset.bucket_name,
          asset.asset_key,
        );

        if (success) {
          results.successful++;
        } else {
          results.failed++;
        }
      } catch (err) {
        results.errors.push(
          `Error processing asset ${asset.id}: ${String(err)}`,
        );
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transcript sync cron completed",
      results,
    });
  } catch (error) {
    console.error("Transcript sync cron error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
