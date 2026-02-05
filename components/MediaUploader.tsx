"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  UploadFileType,
  UploadResponse,
} from "@/lib/upload.types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import ImageUploadWithCrop from "@/components/image-upload";
import React from "react";

interface MediaUploaderProps {
  type: UploadFileType; // "video" | "image"
  label?: string;
  onUploaded?: (url: string, uploadUrl?: string) => void;
}

// Dedicated VideoUploader component
function VideoUploader({
  label,
  onUploaded,
}: {
  label?: string;
  onUploaded?: (url: string, uploadUrl?: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      const res = await fetch("/api/s3/upload-url", {
        method: "POST",
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          category: "video",
        }),
      });

      if (!res.ok) {
        setError("Invalid file type");
        setUploading(false);
        return;
      }

      const data: UploadResponse = await res.json();

      // Use XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.uploadUrl);
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
            reject(new Error("Failed to upload to S3. Please check your AWS credentials and CORS settings."));
          }
        };
        xhr.onerror = () => reject(new Error("Failed to upload to S3."));
        xhr.send(selectedFile);
      });

      setPreviewUrl(data.publicUrl);
      setSuccess(true);
      setError(null);
      setUploading(false);
      setProgress(100);
      onUploaded?.(data.publicUrl, data.uploadUrl);
    } catch (err: any) {
      setError(err.message || "Failed to upload to S3.");
      setUploading(false);
      setSuccess(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {label && <label className="block font-medium mb-1">{label}</label>}

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
        className="max-w-md"
      />
    );
  }

  // Dedicated UI for video
  return <VideoUploader label={label} onUploaded={onUploaded} />;
}
