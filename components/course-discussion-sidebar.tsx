import React, { useEffect, useState } from 'react';

interface Thread {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
}

interface SidebarProps {
  courseId: string;
  onSelectThread: (threadId: string) => void;
}

const CourseDiscussionSidebar: React.FC<SidebarProps> = ({ courseId, onSelectThread }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/courses/${courseId}/discussion-threads`)
      .then(res => res.json())
      .then(data => setThreads(data))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <aside style={{ width: 280, padding: 16 }}>
      <h3>Threads</h3>
      {loading ? <div>Loading...</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {threads.map(thread => (
            <li key={thread.id} style={{ marginBottom: 8 }}>
              <button onClick={() => onSelectThread(thread.id)} style={{ width: '100%', textAlign: 'left' }}>
                {thread.title} {thread.is_pinned ? '📌' : ''} {thread.is_locked ? '🔒' : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default CourseDiscussionSidebar;
