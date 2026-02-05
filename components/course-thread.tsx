import React, { useEffect, useState } from 'react';

interface Reply {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
}

interface ThreadDetails {
  id: string;
  title: string;
  body: string;
  is_locked: boolean;
}

interface Props {
  threadId: string;
}

const CourseThread: React.FC<Props> = ({ threadId }) => {
  const [thread, setThread] = useState<ThreadDetails | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/discussion-threads/${threadId}`).then(res => res.json()),
      fetch(`/api/discussion-threads/${threadId}/replies`).then(res => res.json())
    ])
      .then(([threadData, repliesData]) => {
        setThread(threadData);
        setReplies(repliesData);
      })
      .finally(() => setLoading(false));
  }, [threadId]);

  const handlePostReply = async () => {
    if (!newReply.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/discussion-threads/${threadId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newReply })
    });
    if (res.ok) {
      const reply = await res.json();
      setReplies(r => [...r, reply]);
      setNewReply('');
    }
    setLoading(false);
  };

  const handleDeleteReply = async (replyId: string) => {
    setLoading(true);
    const res = await fetch(`/api/discussion-threads/${threadId}/replies/${replyId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setReplies(r => r.filter(rep => rep.id !== replyId));
    }
    setLoading(false);
  };

  if (loading || !thread) return <div>Loading...</div>;

  return (
    <section style={{ padding: 16 }}>
      <h2>{thread.title}</h2>
      <p>{thread.body}</p>
      <div>
        <h4>Replies</h4>
        <ul>
          {replies.map(reply => (
            <li key={reply.id}>
              <div>{reply.body}</div>
              <button onClick={() => handleDeleteReply(reply.id)}>Delete</button>
            </li>
          ))}
        </ul>
        <textarea value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Write a reply..." />
        <button onClick={handlePostReply}>Post Reply</button>
      </div>
    </section>
  );
};

export default CourseThread;
