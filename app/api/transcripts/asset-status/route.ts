import { NextRequest, NextResponse } from "next/server";
import {
  matchAssetWithTranscript,
  getAssetTranscriptStatus,
  getCourseAssetsWithTranscriptStatus,
} from "@/lib/transcript-utils";

/**
 * GET: Check transcript status for assets
 * ?courseId=xxx - Get all assets in course with transcript status
 * ?bucket=xxx&assetKey=xxx - Get transcript status for specific asset
 */
export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId");
    const bucket = req.nextUrl.searchParams.get("bucket");
    const assetKey = req.nextUrl.searchParams.get("assetKey");

    // Get all assets in a course with transcript status
    if (courseId) {
      const assets = await getCourseAssetsWithTranscriptStatus(courseId);

      return NextResponse.json({
        success: true,
        courseId,
        total: assets.length,
        with_transcripts: assets.filter(
          (a: any) => a.transcript?.status === "completed",
        ).length,
        processing: assets.filter(
          (a: any) => a.transcript?.status === "processing",
        ).length,
        failed: assets.filter((a: any) => a.transcript?.status === "failed")
          .length,
        no_transcript: assets.filter((a: any) => !a.transcript).length,
        assets,
      });
    }

    // Get status for specific asset
    if (bucket && assetKey) {
      const status = await getAssetTranscriptStatus(assetKey, bucket);

      return NextResponse.json({
        success: true,
        bucket,
        assetKey,
        ...status,
      });
    }

    return NextResponse.json(
      {
        error:
          "Missing parameters. Use ?courseId=xxx or ?bucket=xxx&assetKey=xxx",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Asset transcript status error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

/**
 * POST: Manually retry transcript for an asset
 */
export async function POST(req: NextRequest) {
  try {
    const { bucket, assetKey, action } = await req.json();

    if (!bucket || !assetKey) {
      return NextResponse.json(
        { error: "Missing bucket or assetKey" },
        { status: 400 },
      );
    }

    if (action === "check-match") {
      // Check if there's a matching transcript
      const transcript = await matchAssetWithTranscript(assetKey, bucket);

      if (!transcript) {
        return NextResponse.json({
          success: true,
          matched: false,
          message: "No matching transcript found for this asset",
        });
      }

      return NextResponse.json({
        success: true,
        matched: true,
        transcript: {
          id: transcript.id,
          s3_key: transcript.s3_key,
          status: transcript.status,
          has_content: !!transcript.transcript,
          error_message: transcript.error_message,
          created_at: transcript.created_at,
          updated_at: transcript.updated_at,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Asset transcript error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
