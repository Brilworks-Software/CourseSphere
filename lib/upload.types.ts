export type UploadFileType = "video" | "image";

// Add allowed MIME types
export type AllowedVideoMimeType = "video/mp4";
export type AllowedImageMimeType = "image/jpeg" | "image/png" | "image/webp";
export type AllowedMimeType = AllowedVideoMimeType | AllowedImageMimeType;

export interface UploadRequestBody {
  fileName: string;
  fileType: AllowedMimeType;
  category: UploadFileType;
  lessonId?: string;
  courseId?: string;
  userId?: string;
  // Optional client-provided metadata for validation
  fileSize?: number; // bytes
  duration?: number; // seconds
}

export interface UploadResponse {
  uploadUrl?: string;
  publicUrl?: string;
  category?: UploadFileType;
  aws_asset_key?: string;
  aws_asset_id?: string | null; // <-- Allow null as well as string/undefined
}
