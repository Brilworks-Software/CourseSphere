import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface TranscriptData {
  s3_bucket: string;
  s3_key: string;
  transcript: string;
  status: "completed" | "failed" | "processing";
  error_message?: string | null;
}

/**
 * Extract filename base without extension and folder
 * e.g., "videos/1775632118691-file.mp4" -> "1775632118691-file"
 * e.g., "audio/1775632118691-file.wav" -> "1775632118691-file"
 */
export function extractFilenameBases(s3Key: string): string {
  const filename = s3Key.split("/").pop() || s3Key; // Get after last /
  return filename.substring(0, filename.lastIndexOf(".")); // Remove extension
}

/**
 * Fetch transcript from AWS S3
 */
export async function fetchTranscriptFromAWS(
  bucket: string,
  key: string,
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const transcriptText = await response.Body?.transformToString();

    return transcriptText || null;
  } catch (error) {
    console.error(`Error fetching transcript from S3:`, error);
    return null;
  }
}

/**
 * Store/Update transcript in video_transcripts table
 */
export async function storeTranscript(data: TranscriptData) {
  try {
    // Check if transcript already exists for this S3 object
    const { data: existing } = await supabase
      .from("video_transcripts")
      .select("id")
      .eq("s3_bucket", data.s3_bucket)
      .eq("s3_key", data.s3_key)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("video_transcripts")
        .update({
          transcript: data.transcript,
          status: data.status,
          error_message: data.error_message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Error updating transcript:", error);
        return false;
      }
    } else {
      // Create new
      const { error } = await supabase.from("video_transcripts").insert({
        s3_bucket: data.s3_bucket,
        s3_key: data.s3_key,
        transcript: data.transcript,
        status: data.status,
        error_message: data.error_message,
      });

      if (error) {
        console.error("Error inserting transcript:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error storing transcript:", error);
    return false;
  }
}

/**
 * Process AWS asset and fetch its transcript
 */
export async function processAWSAssetTranscript(
  bucket: string,
  s3Key: string,
): Promise<boolean> {
  try {
    // Mark as processing
    await storeTranscript({
      s3_bucket: bucket,
      s3_key: s3Key,
      transcript: "",
      status: "processing",
    });

    // Fetch transcript from AWS
    const transcript = await fetchTranscriptFromAWS(bucket, s3Key);

    if (transcript) {
      // Store successfully
      await storeTranscript({
        s3_bucket: bucket,
        s3_key: s3Key,
        transcript,
        status: "completed",
      });
      return true;
    } else {
      // Failed to fetch
      await storeTranscript({
        s3_bucket: bucket,
        s3_key: s3Key,
        transcript: "",
        status: "failed",
        error_message: "Failed to fetch transcript from AWS",
      });
      return false;
    }
  } catch (error) {
    await storeTranscript({
      s3_bucket: bucket,
      s3_key: s3Key,
      transcript: "",
      status: "failed",
      error_message: String(error),
    });
    return false;
  }
}

/**
 * Get all completed transcripts for a course
 */
export async function getCourseTranscripts(courseId: string) {
  try {
    const { data, error } = await supabase
      .from("video_transcripts")
      .select("*")
      .eq("s3_bucket", `course-${courseId}`)
      .eq("status", "completed")
      .not("transcript", "is", null);

    if (error) {
      console.error("Error fetching transcripts:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCourseTranscripts:", error);
    return [];
  }
}

/**
 * Check if course has at least 1 transcript
 */
export async function courseHasTranscripts(courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("video_transcripts")
      .select("id", { count: "exact" })
      .eq("s3_bucket", `course-${courseId}`)
      .eq("status", "completed");

    if (error) return false;

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error("Error checking transcripts:", error);
    return false;
  }
}

/**
 * Match AWS asset with transcript by filename
 * Returns transcript data if found, null otherwise
 */
export async function matchAssetWithTranscript(
  assetKey: string,
  bucket: string,
) {
  try {
    const assetBase = extractFilenameBases(assetKey);

    // Search for transcript with matching filename base
    const { data, error } = await supabase
      .from("video_transcripts")
      .select("*")
      .eq("s3_bucket", bucket)
      .ilike("s3_key", `%${assetBase}%`)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error matching asset with transcript:", error);
    return null;
  }
}

/**
 * Get transcript status for an AWS asset
 */
export async function getAssetTranscriptStatus(
  assetKey: string,
  bucket: string,
) {
  try {
    const transcript = await matchAssetWithTranscript(assetKey, bucket);

    if (!transcript) {
      return {
        hasTranscript: false,
        status: null,
        id: null,
        message: "No transcript found for this asset",
      };
    }

    return {
      hasTranscript: transcript.status === "completed",
      status: transcript.status,
      id: transcript.id,
      transcript: transcript.transcript || null,
      error_message: transcript.error_message,
      created_at: transcript.created_at,
      updated_at: transcript.updated_at,
    };
  } catch (error) {
    console.error("Error getting transcript status:", error);
    return {
      hasTranscript: false,
      status: null,
      id: null,
      error: String(error),
    };
  }
}

/**
 * Get all AWS assets in a course with their transcript status
 */
export async function getCourseAssetsWithTranscriptStatus(courseId: string) {
  try {
    // Get all AWS assets for this course
    const { data: assets, error: assetsError } = await supabase
      .from("aws_assets")
      .select("*")
      .eq("related_course_id", courseId)
      .in("file_type", ["video/mp4", "video/webm", "video/quicktime"]);

    if (assetsError) {
      console.error("Error fetching assets:", assetsError);
      return [];
    }

    // Get all transcripts for this bucket
    const { data: transcripts, error: transcriptsError } = await supabase
      .from("video_transcripts")
      .select("*")
      .eq("s3_bucket", assets?.[0]?.bucket_name || "");

    if (transcriptsError) {
      console.warn("Error fetching transcripts:", transcriptsError);
    }

    // Map assets to transcripts
    const result = (assets || []).map((asset: any) => {
      const assetBase = extractFilenameBases(asset.asset_key);
      const matchedTranscript = (transcripts || []).find((t: any) => {
        const transcriptBase = extractFilenameBases(t.s3_key);
        return transcriptBase === assetBase;
      });

      return {
        asset: {
          id: asset.id,
          bucket: asset.bucket_name,
          asset_key: asset.asset_key,
          file_name: asset.file_name,
          file_type: asset.file_type,
          size: asset.size,
          created_at: asset.created_at,
        },
        transcript: matchedTranscript
          ? {
              id: matchedTranscript.id,
              status: matchedTranscript.status,
              s3_key: matchedTranscript.s3_key,
              has_content: !!matchedTranscript.transcript,
              error_message: matchedTranscript.error_message,
              created_at: matchedTranscript.created_at,
              updated_at: matchedTranscript.updated_at,
            }
          : null,
        matched: !!matchedTranscript,
        transcriptStatus: matchedTranscript?.status || "not_found",
      };
    });

    return result;
  } catch (error) {
    console.error("Error in getCourseAssetsWithTranscriptStatus:", error);
    return [];
  }
}
