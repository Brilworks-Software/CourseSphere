"use client";
import Link from "next/link";
import { useUserContext } from "@/app/provider/user-context";
import React from "react";

type Props = {};

const StudentLiveList = (props: Props) => {
  const { user } = useUserContext();
  const [streams, setStreams] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.id) return;

    const fetchStreams = async () => {
      setLoading(true);
      setError(null);
      try {
        // call API to get streams for courses where this student is enrolled
        const res = await fetch(
          `/api/admin/courses/live-stream?student_id=${user.id}&only_live=true`,
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err?.error || `Request failed: ${res.status}`);
          setStreams([]);
        } else {
          const data = await res.json();
          setStreams(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        setError(e?.message || String(e));
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, [user?.id]);

  if (!user)
    return (
      <div className="text-sm text-muted-foreground">
        Please sign in to see your live streams.
      </div>
    );

  if (loading)
    return (
      <div className="text-sm text-muted-foreground">
        Loading live streams...
      </div>
    );

  if (error) return <div className="text-sm text-destructive">{error}</div>;

  if (streams.length === 0)
    return (
      <div className="text-sm text-muted-foreground">
        No ongoing live streams for your courses.
      </div>
    );

  return (
    <div className="space-y-3">
      {streams.map((s: any) => (
        <Link
          key={s.id}
          href={`/courses/live-stream/${s.id}`}
          className="block"
        >
          <div className="p-3 border rounded hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-muted-foreground">
                  {s.description ?? ""}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {s.scheduled_start_at
                  ? new Date(s.scheduled_start_at).toLocaleString()
                  : ""}
                <div>{s.status}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Instructor: {s.instructor?.first_name} {s.instructor?.last_name}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default StudentLiveList;
