// AnnouncementComments.tsx
// Child component for displaying and posting comments under an announcement
import React, { useEffect, useState } from "react";
// Import shadcn components
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { SendHorizonal } from "lucide-react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Trash2 } from "lucide-react";

interface Comment {
  id: string;
  thread_id: string;
  user_id: string;
  parent_reply_id: string | null;
  body: string;
  is_instructor_reply: boolean;
  upvote_count: number;
  downvote_count: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string;
  };
}

interface AnnouncementCommentsProps {
  announcementId: string;
  allowComments: boolean;
  isLocked: boolean;
  currentUser: { id: string; role: string };
  courseId: string;
}

const AnnouncementComments: React.FC<AnnouncementCommentsProps> = ({
  announcementId,
  allowComments,
  isLocked,
  currentUser,
  courseId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [announcementId]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newComment,
          user_id: currentUser.id,
          user_role: currentUser.role,
          course_id: courseId,
          announcement_id: announcementId,
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setNewComment("");
      await fetchComments();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!commentId) return;
    setDeletingId(commentId);
    setError(null);
    try {
      const res = await fetch(
        `/api/announcements/${announcementId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: currentUser.id, commentId }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete comment");
      }
      await fetchComments();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Enter/Shift+Enter in textarea
  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!posting && newComment.trim()) {
        handlePost();
      }
    }
    // Shift+Enter will insert a new line by default
  };

  if (!allowComments)
    return (
      <div className="text-muted-foreground">
        Comments are disabled for this announcement.
      </div>
    );
  if (isLocked)
    return (
      <div className="text-muted-foreground">This announcement is locked.</div>
    );

  return (
    <div className="space-y-4 mt-4">
      <div className="mb-2">
        <Textarea
          className="w-full mt-2"
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Add a comment..."
          disabled={posting}
        />
        <div className="flex items-center justify-between gap-2 mt-2">
          <Button
            onClick={handlePost}
            disabled={posting || !newComment.trim()}
            aria-label="Send"
            type="button"
          >
            {posting ? <Spinner className="size-4 mr-2" /> : null}
            Comment <SendHorizonal className="size-5 ml-1" />
          </Button>
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
            <KbdGroup>
              <Kbd>Enter</Kbd>
              <span>to post</span>
              <Kbd>Shift</Kbd>
              <span>+</span>
              <Kbd>Enter</Kbd>
              <span>for new line</span>
            </KbdGroup>
          </div>
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </div>
      <Separator />
      <div>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Spinner className="size-5" />
            <span>Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-muted-foreground">No comments yet.</div>
        ) : (
          <ul className="space-y-2">
            {comments.map((comment) => (
              <li key={comment.id} className="border-b pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <img
                    src={comment.user?.profile_picture_url}
                    alt={comment.user?.first_name || "User"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="font-medium text-foreground">
                    {comment.user?.first_name} {comment.user?.last_name}
                  </span>
                  <span className="mx-1">•</span>
                  <span>{new Date(comment.created_at).toLocaleString()}</span>
                  {comment.is_instructor_reply && (
                    <Badge variant="secondary" className="ml-2">
                      Instructor
                    </Badge>
                  )}
                  {comment.user_id === currentUser.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      aria-label="Delete comment"
                    >
                      {deletingId === comment.id ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
                <div>{comment.body}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnnouncementComments;
