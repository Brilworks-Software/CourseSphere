"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function LessonVideoUploadPage() {
  const params = useParams();
  const lessonId = params?.id as string;
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [lesson, setLesson] = useState<{
    id: string;
    title: string;
    video_url: string | null;
    duration?: number | null;
  } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch lesson details on mount
  useEffect(() => {
    async function fetchLesson() {
      setError(null);
      try {
        const res = await fetch(`/api/admin/courses/lesson/${lessonId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch lesson");
        }
        const data = await res.json();
        setLesson(data);
        setShowUpload(!data.video_url);
      } catch (err: any) {
        setError(err.message);
      }
    }
    if (lessonId) fetchLesson();
  }, [lessonId]);

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", videoFile);

      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "course_videos";
      formData.append("upload_preset", uploadPreset);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Cloudinary cloud name not configured.");

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(
              new Error(
                JSON.parse(xhr.responseText)?.error?.message ||
                  "Failed to upload video"
              )
            );
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
      });

      xhr.send(formData);

      const uploadData = await uploadPromise;

      // Update lesson video_url via API
      const response = await fetch(`/api/admin/courses/lesson/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: uploadData.public_id,
          duration: uploadData.duration
            ? Math.round(uploadData.duration)
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update lesson");
      }

      setSuccess(true);
      setVideoFile(null);

      // Refetch lesson to update video_url
      const res = await fetch(`/api/admin/courses/lesson/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setLesson(data);
        setShowUpload(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Helper to get Cloudinary video URL from public_id
  const getCloudinaryVideoUrl = (publicId: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return "";
    return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`;
  };

  // Helper to format duration in mm:ss
  const formatDuration = (seconds?: number | null) => {
    if (!seconds || isNaN(seconds)) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-[1800px] bg-background rounded-xl shadow-lg p-8 flex flex-col items-center">
        
        {lesson?.video_url && !showUpload ? (
          <div className="w-full flex flex-col md:flex-row gap-6 items-start">
            <video
              src={getCloudinaryVideoUrl(lesson.video_url)}
              controls
              className="rounded-lg mb-4 w-fit aspect-video h-[620px] bg-black md:mb-0"
            />
            <div className="bg-muted rounded-lg p-4 min-w-[220px] w-full flex-1 shadow border">
              <div className="mb-2">
                <span className="font-semibold text-sm text-muted-foreground">
                  Title:
                </span>
                <div className="text-base">{lesson.title}</div>
              </div>
              <div className="mb-2">
                <span className="font-semibold text-sm text-muted-foreground">
                  Duration:
                </span>
                <div className="text-base">
                  {formatDuration(lesson.duration)}
                </div>
              </div>
              <div>
              </div>
            {/* Change Video button below for mobile, on side for desktop */}
            <div className="flex flex-col w-full md:w-auto">
              <Button
                className="mt-8 md:mt-0 flex items-center"
                onClick={() => {
                  setShowUpload(true);
                  setSuccess(false);
                  setError(null);
                }}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Change Video
              </Button>
            </div>
            </div>
          </div>
        ) : (
          <p className="mb-6 text-muted-foreground text-center">
            Drag and drop a video file below, or click Browse to select a file.
            <br />
            Supported formats: MP4, MOV, WEBM (max 500MB)
          </p>
        )}

        {(showUpload || !lesson?.video_url) && (
          <form onSubmit={handleUpload} className="w-full">
            <div
              className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-10 mb-6 transition-colors ${
                dragActive
                  ? "border-primary bg-muted/50"
                  : "border-muted bg-muted"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: uploading ? "not-allowed" : "pointer" }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/mov,video/webm"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              <UploadCloud
                className="w-14 h-14 text-primary mb-3"
                strokeWidth={1.5}
              />
              <span className="font-medium text-base mb-2">
                {videoFile ? videoFile.name : "Drag and drop video file here"}
              </span>
              <Button
                type="button"
                variant="default"
                className="mt-2"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse
              </Button>
            </div>

            {videoFile && (
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground truncate max-w-[70%]">
                  {videoFile.name}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setVideoFile(null)}
                  disabled={uploading}
                >
                  <XCircle className="w-5 h-5 text-destructive" />
                </Button>
              </div>
            )}

            {uploading && (
              <div className="mb-4">
                <Progress value={progress} className="h-3" />
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  Uploading... {progress}%
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 text-destructive text-sm">
                <XCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 text-success text-sm">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Video uploaded and lesson updated!
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={uploading || !videoFile}
            >
              {uploading ? `Uploading... (${progress}%)` : "Upload Video"}
            </Button>
            {lesson?.video_url && (
              <Button
                type="button"
                variant="ghost"
                className="w-full mt-2"
                disabled={uploading}
                onClick={() => {
                  setShowUpload(false);
                  setVideoFile(null);
                  setError(null);
                  setSuccess(false);
                }}
              >
                Cancel
              </Button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
