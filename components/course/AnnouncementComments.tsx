// AnnouncementComments.tsx
// Child component for displaying and posting comments under an announcement
import React, { useEffect, useState } from 'react';
// Import shadcn components
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  privateThread?: boolean;
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
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/announcements/${announcementId}/comments`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [announcementId]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: newComment,
          user_id: currentUser.id,
          user_role: currentUser.role,
          course_id: courseId,
          announcement_id: announcementId,
        }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      const data = await res.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  if (!allowComments) return <div className="text-muted-foreground">Comments are disabled for this announcement.</div>;
  if (isLocked) return <div className="text-muted-foreground">This announcement is locked.</div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="mb-2">
        <Textarea
          className="w-full mt-2"
          rows={2}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          disabled={posting}
        />
        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={handlePost}
            disabled={posting || !newComment.trim()}
          >
            {posting ? 'Posting...' : 'Post Comment'}
          </Button>
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </div>
      <Separator />
      <div>
        {loading ? (
          <div>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-muted-foreground">No comments yet.</div>
        ) : (
          <ul className="space-y-2">
            {comments.map(comment => (
              <li key={comment.id} className="border-b pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {comment.user_id} • {new Date(comment.created_at).toLocaleString()}
                  {comment.privateThread && (
                    <Badge variant="secondary" className="ml-2">Private Thread</Badge>
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
