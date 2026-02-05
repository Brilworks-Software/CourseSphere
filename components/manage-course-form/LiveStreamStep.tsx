import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LiveStreamStep({
  courseId,
  instructorId,
  initial = {},
}: {
  courseId: string;
  instructorId: string;
  initial?: any;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [youtubeVideoId, setYoutubeVideoId] = useState(
    initial.youtube_video_id ?? "",
  );
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState(
    initial.youtube_video_url ?? "",
  );
  const [scheduledStartAt, setScheduledStartAt] = useState(
    initial.scheduled_start_at ?? "",
  );
  const [scheduledEndAt, setScheduledEndAt] = useState(
    initial.scheduled_end_at ?? "",
  );
  // status is handled by backend; don't expose in UI
  const [loading, setLoading] = useState(false);

  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // extract YouTube video ID from many common YouTube URL formats
  const extractYouTubeId = (url: string) => {
    if (!url) return "";
    try {
      // handle shortened youtu.be links
      const youtuBeMatch = url.match(/youtu\.be\/([-_A-Za-z0-9]{11})/);
      if (youtuBeMatch) return youtuBeMatch[1];

      // handle v= param and other query params
      const urlObj = new URL(url);
      const v = urlObj.searchParams.get("v");
      if (v && v.length === 11) return v;

      // handle /embed/{id}
      const embedMatch = url.match(/embed\/([-_A-Za-z0-9]{11})/);
      if (embedMatch) return embedMatch[1];

      // fallback: try to find any 11-char id-like token
      const genericMatch = url.match(/([-_A-Za-z0-9]{11})/);
      return genericMatch ? genericMatch[1] : "";
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    const id = extractYouTubeId(youtubeVideoUrl);
    setYoutubeVideoId(id);
  }, [youtubeVideoUrl]);

  const handleSave = async () => {
    setLoading(true);
    const isEditing = !!initial?.id;
    const endpoint = isEditing
      ? `/api/admin/courses/live-stream/${initial.id}`
      : `/api/admin/courses/live-stream`;
    const method = isEditing ? "PUT" : "POST";

    // start an explicit loading toast (replace toast.promise)
    const toastId = toast.loading(
      isEditing ? "Updating live stream..." : "Saving live stream...",
    );

    try {
      // validate youtube url -> id if provided
      if (youtubeVideoUrl && !youtubeVideoId) {
        throw new Error("Invalid YouTube URL — could not extract video id.");
      }

      const payload = {
        course_id: courseId,
        instructor_id: instructorId,
        title,
        description,
        youtube_video_id: youtubeVideoId || null,
        youtube_video_url: youtubeVideoUrl || null,
        scheduled_start_at: scheduledStartAt || null,
        scheduled_end_at: scheduledEndAt || null,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error ||
            `Failed to ${isEditing ? "update" : "save"} live stream`,
        );
      }

      // success — update the loading toast
      toast.success(isEditing ? "Live stream updated" : "Live stream saved", {
        id: toastId,
      });
    } catch (err: any) {
      // show error toast (update/dismiss the loading toast)
      toast.error(
        err?.message ||
          (isEditing
            ? "Failed to update live stream"
            : "Failed to save live stream"),
        { id: toastId },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium mb-1">Title</Label>
        <Input
          ref={titleRef}
          className="w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Live stream title"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium mb-1">Description</Label>
        <Textarea
          className="w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will you cover in the live stream?"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label className="block text-sm font-medium mb-1">
            YouTube Video URL
          </Label>
          <Input
            className="w-full"
            value={youtubeVideoUrl}
            onChange={(e) => setYoutubeVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            {youtubeVideoId ? (
              <>
                Extracted video id:{" "}
                <code className="font-mono">{youtubeVideoId}</code>
              </>
            ) : (
              "Video id will be extracted automatically from the URL."
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium mb-1">
            Scheduled start
          </Label>
          <Input
            type="datetime-local"
            className="w-full"
            value={scheduledStartAt}
            onChange={(e) => setScheduledStartAt(e.target.value)}
          />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-1">
            Scheduled end
          </Label>
          <Input
            type="datetime-local"
            className="w-full"
            value={scheduledEndAt}
            onChange={(e) => setScheduledEndAt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Live Stream"}
        </Button>
      </div>
    </div>
  );
}
