import { useState, useEffect } from "react";
import MarkdownEditor from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import HtmlPreview from "@/components/html-preview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface AnnouncementStepProps {
  courseId: string;
  instructorId: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  is_published: boolean;
  is_pinned: boolean;
  created_at: string;
  discussion_thread?: any;
  replies?: any[];
}

export default function AnnouncementStep({ courseId, instructorId }: AnnouncementStepProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch announcements
  useEffect(() => {
    fetch(`/api/admin/courses/announcement/${courseId}`)
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data : []));
  }, [courseId, success, open]);

  // Open modal for create or edit
  const handleOpen = (announcement?: Announcement) => {
    if (announcement) {
      setEditId(announcement.id);
      setTitle(announcement.title);
      setMessage(announcement.message);
      setIsPublished(announcement.is_published);
      setIsPinned(announcement.is_pinned);
    } else {
      setEditId(null);
      setTitle("");
      setMessage("");
      setIsPublished(true);
      setIsPinned(false);
    }
    setOpen(true);
  };

  // Submit handler for create/update
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const method = editId ? "PUT" : "POST";
      const url = `/api/admin/courses/announcement/${courseId}${editId ? `?announcement_id=${editId}` : ""}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          instructor_id: instructorId,
          title,
          message,
          is_published: isPublished,
          is_pinned: isPinned,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save announcement");
      }
      setSuccess(editId ? "Announcement updated!" : "Announcement created!");
      setOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Your Announcement</h2>
        <Button onClick={() => handleOpen()}>New Announcement</Button>
      </div>
      <div className="space-y-2">
        {announcements.length === 0 && <div className="text-center pt-9 text-muted-foreground">No announcements yet.</div>}
        {announcements.map(a => {
          const formattedTime = formatDistanceToNow(new Date(a.created_at), { addSuffix: true });
          return (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <CardDescription className="flex gap-2 items-center mt-1">
                    {a.is_pinned && <span className="mr-2">📌 Pinned</span>}
                    <span>{a.is_published ? "Published" : "Draft"}</span>
                    <span className="text-xs text-muted-foreground ml-2">{formattedTime}</span>
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpen(a)}>Edit</Button>
              </CardHeader>
              <CardContent>
                <HtmlPreview html={a.message} className="prose max-w-none" />
                {(a.discussion_thread || (a.replies && a.replies.length > 0)) && (
                  <div className="mt-4">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" disabled>
                        View Comments
                      </Button>
                    </div>
                    {/* Render replies list below the button */}
                    {a.replies && a.replies.length > 0 && (
                      <div className="mt-2 space-y-3 border-t pt-2">
                        {a.replies.map(reply => (
                          <div key={reply.id} className="flex gap-2 items-start">
                            <img
                              src={reply.user?.profile_picture_url}
                              alt={reply.user?.first_name}
                              className="w-6 h-6 rounded-full mt-1"
                            />
                            <div>
                              <div className="text-sm font-medium">
                                {reply.user?.first_name} {reply.user?.last_name}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="text-sm">{reply.body}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Title</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Message</label>
              <MarkdownEditor value={message} onChange={setMessage} placeholder="Write your announcement..." />
              
            </div>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2">
                <Checkbox checked={isPublished} onCheckedChange={checked => setIsPublished(checked === true)} />
                Published
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={isPinned} onCheckedChange={checked => setIsPinned(checked === true)} />
                Pin to top
              </label>
            </div>
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={loading || !title || !message}>
              {loading ? (editId ? "Saving..." : "Posting...") : (editId ? "Save Changes" : "Post Announcement")}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
