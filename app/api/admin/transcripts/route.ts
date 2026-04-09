import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processAWSAssetTranscript } from "@/lib/transcript-utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Admin endpoint to manually fetch and sync a specific transcript
 * POST: Fetch and store transcript for a specific S3 object
 * GET: Get all transcripts status
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin - you should add proper auth here
    const courseId = req.headers.get("x-course-id");
    if (!courseId) {
      return NextResponse.json({ error: "Missing course ID" }, { status: 400 });
    }

    const { s3_bucket, s3_key, action } = await req.json();

    if (!s3_bucket || !s3_key) {
      return NextResponse.json(
        { error: "Missing S3 bucket or key" },
        { status: 400 },
      );
    }

    switch (action) {
      case "fetch":
        // Fetch and store transcript
        const success = await processAWSAssetTranscript(s3_bucket, s3_key);
        return NextResponse.json({
          success,
          message: success
            ? "Transcript fetched and stored successfully"
            : "Failed to fetch transcript",
        });

      case "manual-add":
        // Manually add transcript (for cases where AWS transcript generation fails)
        const { transcript } = await req.json();

        if (!transcript) {
          return NextResponse.json(
            { error: "Missing transcript text" },
            { status: 400 },
          );
        }

        const { error } = await supabase
          .from("video_transcripts")
          .update({
            transcript,
            status: "completed",
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq("s3_bucket", s3_bucket)
          .eq("s3_key", s3_key);

        if (error) {
          return NextResponse.json(
            { error: "Failed to update transcript", details: error },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Transcript updated successfully",
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

/**
 * GET: Retrieve transcript status and details
 */
export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId");
    const s3Bucket = req.nextUrl.searchParams.get("s3_bucket");
    const s3Key = req.nextUrl.searchParams.get("s3_key");

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    let query = supabase
      .from("video_transcripts")
      .select("*")
      .eq("s3_bucket", `course-${courseId}`);

    // Optional filters
    if (s3Bucket) query = query.eq("s3_bucket", s3Bucket);
    if (s3Key) query = query.eq("s3_key", s3Key);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch transcripts", details: error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      transcripts: data,
      count: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
