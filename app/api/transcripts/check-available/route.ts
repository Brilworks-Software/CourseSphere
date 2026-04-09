import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

/**
 * Extract filename base without extension
 */
function extractFileBase(path: string): string {
  const filename = path.split("/").pop() || path;
  return filename.substring(0, filename.lastIndexOf("."));
}

/**
 * Check if course has any completed transcripts using the proper flow:
 * courseId → lessons → aws_assets → video_transcripts
 */
async function checkCourseHasTranscripts(courseId: string): Promise<{
  hasTranscripts: boolean;
  count: number;
}> {
  try {
    // STEP 1: Get all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, aws_assets_data_id")
      .eq("course_id", courseId);

    if (lessonsError || !lessons || lessons.length === 0) {
      return { hasTranscripts: false, count: 0 };
    }

    // STEP 2: Get aws_assets for all lessons
    const awsAssetIds = lessons
      .map((l: any) => l.aws_assets_data_id)
      .filter(Boolean);

    if (awsAssetIds.length === 0) {
      return { hasTranscripts: false, count: 0 };
    }

    const { data: awsAssets, error: assetsError } = await supabase
      .from("aws_assets")
      .select("id, asset_key, bucket_name")
      .in("id", awsAssetIds);

    if (assetsError || !awsAssets || awsAssets.length === 0) {
      return { hasTranscripts: false, count: 0 };
    }

    // STEP 3: Check for matching transcripts in video_transcripts
    let transcriptCount = 0;

    for (const asset of awsAssets) {
      const assetBase = extractFileBase(asset.asset_key);

      const { data: matchedTranscripts, error: transcriptError } =
        await supabase
          .from("video_transcripts")
          .select("id, s3_key")
          .eq("s3_bucket", asset.bucket_name)
          .eq("status", "completed")
          .not("transcript", "is", null);

      if (!transcriptError && matchedTranscripts) {
        for (const t of matchedTranscripts) {
          const transcriptBase = extractFileBase(t.s3_key);
          if (transcriptBase === assetBase) {
            transcriptCount++;
          }
        }
      }
    }

    return {
      hasTranscripts: transcriptCount > 0,
      count: transcriptCount,
    };
  } catch (err) {
    console.warn("Error checking transcripts:", err);
    return { hasTranscripts: false, count: 0 };
  }
}

export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 },
      );
    }

    // Check transcripts using flow: courseId → lessons → aws_assets → video_transcripts
    const { hasTranscripts, count } = await checkCourseHasTranscripts(courseId);

    return NextResponse.json({
      success: true,
      courseId,
      hasTranscripts,
      transcriptCount: count,
    });
  } catch (error) {
    console.error("Transcript check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
