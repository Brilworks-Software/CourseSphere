import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default function LiveStreamStep({
  courseId,
  instructorId,
  initial = {},
}: {
  courseId: string;
  instructorId: string;
  initial?: any;
}) {
  // Table/list state
  const [streams, setStreams] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<any | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const titleRef = useRef<HTMLInputElement | null>(null);

  // Fetch streams for table
  useEffect(() => {
    setTableLoading(true);
    fetch(
      `/api/admin/courses/live-stream?course_id=${encodeURIComponent(courseId)}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setStreams(Array.isArray(data) ? data : []))
      .finally(() => setTableLoading(false));
  }, [refreshFlag, courseId]);

  // When dialog opens for edit/create, set form fields
  useEffect(() => {
    if (dialogOpen) {
      if (editingStream) {
        setTitle(editingStream.title ?? "");
        setDescription(editingStream.description ?? "");
        setYoutubeVideoId(editingStream.youtube_video_id ?? "");
        setYoutubeVideoUrl(editingStream.youtube_video_url ?? "");
        setScheduledStartAt(editingStream.scheduled_start_at ?? "");
        setScheduledEndAt(editingStream.scheduled_end_at ?? "");
      } else {
        setTitle("");
        setDescription("");
        setYoutubeVideoId("");
        setYoutubeVideoUrl("");
        setScheduledStartAt("");
        setScheduledEndAt("");
      }
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [dialogOpen, editingStream]);

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string) => {
    if (!url) return "";
    try {
      const youtuBeMatch = url.match(/youtu\.be\/([-_A-Za-z0-9]{11})/);
      if (youtuBeMatch) return youtuBeMatch[1];
      const urlObj = new URL(url);
      const v = urlObj.searchParams.get("v");
      if (v && v.length === 11) return v;
      const embedMatch = url.match(/embed\/([-_A-Za-z0-9]{11})/);
      if (embedMatch) return embedMatch[1];
      const genericMatch = url.match(/([-_A-Za-z0-9]{11})/);
      return genericMatch ? genericMatch[1] : "";
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    setYoutubeVideoId(extractYouTubeId(youtubeVideoUrl));
  }, [youtubeVideoUrl]);

  // Save (create/update) handler
  const handleSave = async () => {
    setFormLoading(true);
    const isEditing = !!editingStream?.id;
    const endpoint = isEditing
      ? `/api/admin/courses/live-stream/${editingStream.id}`
      : `/api/admin/courses/live-stream`;
    const method = isEditing ? "PUT" : "POST";
    const toastId = toast.loading(
      isEditing ? "Updating live stream..." : "Saving live stream...",
    );
    try {
      if (youtubeVideoUrl && !youtubeVideoId) {
        throw new Error("Invalid YouTube URL — could not extract video id.");
      }
      const payload = {
        course_id: editingStream?.course_id ?? "",
        instructor_id: editingStream?.instructor_id ?? "",
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
      toast.success(isEditing ? "Live stream updated" : "Live stream saved", {
        id: toastId,
      });
      setDialogOpen(false);
      setEditingStream(null);
      setRefreshFlag((f) => f + 1);
    } catch (err: any) {
      toast.error(
        err?.message ||
          (editingStream
            ? "Failed to update live stream"
            : "Failed to save live stream"),
        { id: toastId },
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Edit handler
  const handleEdit = async (stream: any) => {
    setFormLoading(true);
    const data = await fetch(
      `/api/admin/courses/live-stream/${stream.id}`,
    ).then((res) => res.json());
    setEditingStream(data);
    setDialogOpen(true);
    setFormLoading(false);
  };

  // Create handler
  const handleCreate = () => {
    setEditingStream(null);
    setDialogOpen(true);
  };

  // Delete handler
  const handleDelete = async (stream: any) => {
    if (!window.confirm(`Are you sure you want to delete "${stream.title}"?`))
      return;
    const toastId = toast.loading("Deleting live stream...");
    try {
      const res = await fetch(`/api/admin/courses/live-stream/${stream.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete live stream");
      }
      toast.success("Live stream deleted", { id: toastId });
      setRefreshFlag((f) => f + 1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete live stream", {
        id: toastId,
      });
    }
  };

  // Dialog close handler
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingStream(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Live Streams</h2>
        <Button onClick={handleCreate}>Create New Live Stream</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                Loading...
              </TableCell>
            </TableRow>
          ) : streams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No live streams found.
              </TableCell>
            </TableRow>
          ) : (
            streams.map((stream) => (
              <TableRow key={stream.id}>
                <TableCell>{stream.title}</TableCell>
                <TableCell>{stream.status}</TableCell>
                <TableCell>
                  {stream.scheduled_start_at?.slice(0, 16) ?? "-"}
                </TableCell>
                <TableCell>
                  {stream.scheduled_end_at?.slice(0, 16) ?? "-"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handleEdit(stream)}
                    variant="secondary"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(stream)}
                    variant="destructive"
                    className="ml-2"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStream ? "Edit Live Stream" : "Create Live Stream"}
            </DialogTitle>
          </DialogHeader>
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
              <Label className="block text-sm font-medium mb-1">
                Description
              </Label>
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
              <Button onClick={handleSave} disabled={formLoading}>
                {formLoading ? "Saving..." : "Save Live Stream"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
