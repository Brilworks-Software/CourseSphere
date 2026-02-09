import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  UploadRequestBody,
  UploadResponse,
  AllowedMimeType,
  UploadFileType,
} from "@/lib/upload.types";

// S3 folder constants for asset management
const S3_VIDEO_FOLDER = process.env.AWS_VIDEO_FOLDER || "videos";
const S3_IMAGE_FOLDER = process.env.AWS_IMAGE_FOLDER || "images";

const ALLOWED_MIME_TYPES: Record<UploadFileType, AllowedMimeType[]> = {
  video: ["video/mp4"],
  image: ["image/jpeg", "image/png", "image/webp"],
};

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function toSnakeCase(str: string): string {
  return str
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^\w.]/g, "_") // Replace non-word chars except dot with underscores
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_+|_+$/g, "") // Trim underscores from start/end
    .toLowerCase();
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<UploadResponse>> {
  const body = (await req.json()) as UploadRequestBody;
  const { fileName, fileType, category } = body;

  if (!(category in ALLOWED_MIME_TYPES)) {
    return NextResponse.json({ message: "Unsupported category" } as any, {
      status: 400,
    });
  }

  const allowedTypes = ALLOWED_MIME_TYPES[category];
  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json({ message: "Unsupported file type" } as any, {
      status: 400,
    });
  }

  // Convert fileName to snake_case for S3 key, but also keep original fileName in the key as requested
  const safeFileName = toSnakeCase(fileName);

  // Use folder constants for S3 key
  const folder =
    category === "video"
      ? S3_VIDEO_FOLDER
      : category === "image"
        ? S3_IMAGE_FOLDER
        : "others";
  const keyWithoutFolder = `${Date.now()}-${safeFileName}`;
  const key = `${folder}/${keyWithoutFolder}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    ContentType: fileType,

    // ✅ IMPORTANT PART
    ...(category === "image" && {
      ACL: "public-read",
    }),
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 60,
  });

  const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`; // Return empty string for videos

  return NextResponse.json({
    uploadUrl,
    publicUrl,
    category,
    aws_asset_key: keyWithoutFolder,
  });
}
