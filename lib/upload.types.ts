export type UploadFileType = "video" | "image";

// Add allowed MIME types
export type AllowedVideoMimeType = "video/mp4";
export type AllowedImageMimeType = "image/jpeg" | "image/png" | "image/webp";
export type AllowedMimeType = AllowedVideoMimeType | AllowedImageMimeType;

export interface UploadRequestBody {
  fileName: string;
  fileType: AllowedMimeType;
  category: UploadFileType;
}

export interface UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  category: UploadFileType;
}
