"use client";

import { ChangeEvent, useRef, useState } from "react";
import { UploadFileType, UploadResponse } from "@/lib/upload.types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import ImageUploadWithCrop from "@/components/image-upload";
import React from "react";

interface MediaUploaderProps {
  type: UploadFileType; // "video" | "image"
  label?: string;
  onUploaded?: (
    url: string,
    uploadUrl?: string,
    aws_asset_key?: string,
    duration?: number, // duration in seconds
    aws_asset_id?: string, // <-- Add this param
  ) => void;
  lessonId?: string; // <-- Add lessonId
  courseId?: string; // <-- Add courseId
  userId?: string; // <-- Add userId
  onError?: (message?: string | null) => void;
}

// Dedicated VideoUploader component
function VideoUploader({
  label,
  onUploaded,
  onError,
  lessonId,
  courseId,
  userId,
}: {
  label?: string;
  onUploaded?: (
    url: string,
    uploadUrl?: string,
    aws_asset_key?: string,
    duration?: number,
    aws_asset_id?: string,
  ) => void;
  onError?: (message?: string | null) => void;
  lessonId?: string;
  courseId?: string;
  userId?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);
  console.log("duration", duration);
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(false);
    setProgress(0);
    setDuration(undefined);
    onError?.(null);
    if (!file) return;

    const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
    const MAX_DURATION_SEC = 30 * 60; // 30 minutes

    // Size check
    if (file.size > MAX_SIZE_BYTES) {
      const msg = "File too large. Maximum allowed size is 200 MB.";
      setError(msg);
      onError?.(msg);
      // clear input value so user can reselect
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Extract duration using a temporary video element and validate
    const tempUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.onloadedmetadata = function () {
      // revoke temporary url used only for metadata extraction
      URL.revokeObjectURL(tempUrl);
      const dur = tempVideo.duration
        ? Math.floor(tempVideo.duration)
        : undefined;
      if (typeof dur === "number" && dur > MAX_DURATION_SEC) {
        const msg = "Video exceeds maximum duration of 30 minutes.";
        setError(msg);
        onError?.(msg);
        if (inputRef.current) inputRef.current.value = "";
        setDuration(undefined);
        setSelectedFile(null);
        setPreviewUrl("");
        return;
      }

      // All good — set states and create a preview URL
      setDuration(dur);
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    };

    tempVideo.onerror = function () {
      URL.revokeObjectURL(tempUrl);
      const msg = "Unable to read video metadata. Please try another file.";
      setError(msg);
      onError?.(msg);
      if (inputRef.current) inputRef.current.value = "";
    };

    tempVideo.src = tempUrl;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);
    onError?.(null);

    try {
      const res = await fetch("/api/s3/upload-url", {
        method: "POST",
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          category: "video",
          lessonId, // <-- pass lessonId
          courseId, // <-- pass courseId
          userId, // <-- pass userId
          fileSize: selectedFile.size,
          duration,
        }),
      });

      if (!res.ok) {
        const msg = "Invalid file type";
        setError(msg);
        onError?.(msg);
        setUploading(false);
        return;
      }

      const data: UploadResponse = await res.json();

      // Use XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.uploadUrl || "");
        xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              new Error(
                "Failed to upload to S3. Please check your AWS credentials and CORS settings.",
              ),
            );
          }
        };
        xhr.onerror = () => reject(new Error("Failed to upload to S3."));
        xhr.send(selectedFile);
      });

      setPreviewUrl(data.publicUrl || "");
      setSuccess(true);
      setError(null);
      onError?.(null);
      setUploading(false);
      setProgress(100);
      // Pass aws_asset_key and duration as arguments
      onUploaded?.(
        data.publicUrl || "",
        data.uploadUrl || "",
        data.aws_asset_key,
        duration,
        data.aws_asset_id || "", // <-- Pass asset id
      );
    } catch (err: any) {
      const msg = err.message || "Failed to upload to S3.";
      setError(msg);
      onError?.(msg);
      setUploading(false);
      setSuccess(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {
        // ignore
      }
    }
    setPreviewUrl("");
    setError(null);
    onError?.(null);
    setSuccess(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <label className="block font-medium mb-1">{label}</label>
          <p className="text-xs text-muted-foreground">
            Maximum: 200 MB, 30 minutes
          </p>
        </div>
      )}

      {/* Show selection/validation errors even when no file is selected */}
      {error && !selectedFile && (
        <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {!selectedFile && (
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 w-full justify-center h-46"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="w-5 h-5" />
          Select Video
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {selectedFile && (
        <div className="space-y-2 border rounded-lg p-3 bg-muted">
          <div className="flex items-center gap-3">
            <span className="font-medium">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={uploading}
            >
              Clear
            </Button>
          </div>
          <video
            controls
            preload="metadata"
            className="rounded mt-2 max-h-64"
            style={{ width: "100%", objectFit: "contain" }}
            src={previewUrl || undefined}
          >
            <source src={previewUrl || undefined} type="video/mp4" />
          </video>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
          {uploading && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1 text-center">
                Uploading... {progress}%
              </div>
            </div>
          )}
          {error && (
            <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-2 flex items-center gap-2 text-success text-sm">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Upload successful!
            </div>
          )}
        </div>
      )}

      {success && previewUrl && (
        <video
          controls
          preload="metadata"
          className="rounded mt-2 max-h-64"
          style={{ width: "100%", objectFit: "contain" }}
          src={previewUrl}
        >
          <source src={previewUrl} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export default function MediaUploader({
  type,
  label,
  onUploaded,
  lessonId,
  courseId,
  userId,
  onError,
}: MediaUploaderProps): React.JSX.Element {
  // Only use custom logic for video
  if (type === "image") {
    return (
      <ImageUploadWithCrop
        value={""}
        onChange={(url, file) => {
          onUploaded?.(url);
        }}
        label={label}
        accept="image/jpeg,image/png,image/webp"
        maxSizeMB={5}
        showPreview={true}
        aspectRatio="landscape"
        className="max-w-7xl"
      />
    );
  }

  // Dedicated UI for video
  return (
    <VideoUploader
      label={label}
      onUploaded={onUploaded}
      onError={onError}
      lessonId={lessonId}
      courseId={courseId}
      userId={userId}
    />
  );
}
