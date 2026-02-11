import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/client";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const VIDEO_FOLDER = process.env.AWS_VIDEO_FOLDER!;
const PROCESSED_VIDEO_FOLDER = process.env.AWS_PROCESSED_FOLDER_VIDEO!;
const IMAGE_FOLDER = process.env.AWS_IMAGE_FOLDER!;
const BUCKET = process.env.AWS_S3_BUCKET!;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Missing asset id" }, { status: 400 });
  }

  const supabase = await createClient();
  // Fetch asset row
  const { data: asset, error } = await supabase
    .from("aws_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  try {
    if (asset.file_type === "image") {
      // Delete image from S3
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: `${IMAGE_FOLDER}/${asset.file_name}`,
        }),
      );
    } else if (asset.file_type === "video") {
      // Delete video from both folders if present
      const fileName = asset.file_name;
      const keysToDelete = [
        `${VIDEO_FOLDER}/${fileName}`,
        `${PROCESSED_VIDEO_FOLDER}/${fileName}`,
      ];
      for (const key of keysToDelete) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: BUCKET,
              Key: key,
            }),
          );
        } catch (err) {
          // Ignore if not found, continue
        }
      }
    }
    // Delete asset row from DB
    await supabase.from("aws_assets").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete asset", details: String(err) },
      { status: 500 },
    );
  }
}
