"use client";

import { useState, useRef } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function AddLessonForm({ courseId }: { courseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Please select a video file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload video to Cloudinary
      const formData = new FormData();
      formData.append("file", videoFile);

      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "course_videos";
      formData.append("upload_preset", uploadPreset);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error(
          "Cloudinary cloud name not configured. Please check your .env.local file."
        );
      }

      if (!uploadPreset) {
        throw new Error(
          "Cloudinary upload preset not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file."
        );
      }

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message || "Failed to upload video";
        throw new Error(
          `Upload failed: ${errorMessage}. Please check that the upload preset "${uploadPreset}" exists in your Cloudinary account.`
        );
      }

      const uploadData = await uploadResponse.json();

      // Create lesson
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_id: courseId,
          title,
          video_url: uploadData.public_id,
          duration: uploadData.duration
            ? Math.round(uploadData.duration)
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create lesson");
      }

      // Reset form
      setTitle("");
      setVideoFile(null);
      setIsOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <>
      {/* Trigger button using shadcn Button and lucide Plus icon */}
      <Button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Lesson
      </Button>

      {/* Dialog (shadcn) uses component variants/styles instead of hard-coded colors */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-full p-6 rounded-lg shadow">
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
            <DialogDescription>
              {/* Optional description; kept minimal */}
            </DialogDescription>
          </DialogHeader>

          {/* Error area (no hard coded colors) */}
          {error && (
            <div role="alert" className="rounded-md p-3 mb-4 border">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter lesson title"
              />
            </div>

            <div>
              <Label>Video File *</Label>

              {/* Hidden native file input; controlled by a Button */}
              <input
                ref={fileInputRef}
                id="video-file"
                type="file"
                accept="video/mp4,video/mov,video/webm"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="sr-only"
              />

              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="inline-flex items-center"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>

                <div className="text-sm">
                  {videoFile ? (
                    <span>{videoFile.name}</span>
                  ) : (
                    <span>MP4, MOV, WEBM (MAX. 500MB)</span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex space-x-3">
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Add Lesson"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setTitle("");
                  setVideoFile(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
