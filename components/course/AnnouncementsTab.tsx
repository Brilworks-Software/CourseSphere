"use client";
import React, { useEffect, useState } from "react";
import type { CourseAnnouncement } from "@/lib/types/announcement";
import HtmlPreview from "../html-preview";
import { formatDistanceToNow } from "date-fns";
import AnnouncementComments from "./AnnouncementComments";

interface AnnouncementsTabProps {
  courseId?: string;
  user?: any; // <-- add user prop
}

export default function AnnouncementsTab({ courseId, user }: AnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    fetch(`/api/announcements?courseId=${courseId}`)
      .then(async (res) => {
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Failed to fetch announcements");
        }
        return res.json();
      })
      .then(({ announcements }) => {
        setAnnouncements(announcements || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId) {
    return <div className="text-sm text-muted-foreground">No course selected.</div>;
  }
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading announcements...</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }
  if (!announcements.length) {
    return <div className="text-sm text-muted-foreground">No announcements yet.</div>;
  }

  return (
    <div className="space-y-6">
      {announcements.map((a) => (
        <div
          key={a.id}
          className={`border rounded-lg p-6 bg-background shadow-sm ${a.is_pinned ? "border-primary" : "border-muted"}`}
        >
          <div className="flex items-start gap-3 mb-2">
            <img
              src={a.instructor?.profile_picture_url || "/default-avatar.png"}
              alt="Instructor"
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div className="flex-1">
              <div className="flex flex-col items-start ">
                <span className="font-medium text-primary hover:underline cursor-pointer">
                  {a.instructor?.first_name} {a.instructor?.last_name || "Instructor"}
                </span>
                <span className="text-xs text-muted-foreground">
                  posted an announcement · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
                {a.is_pinned && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-primary text-white rounded">Pinned</span>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {/* Optionally show an icon for announcement */}
              {/* <IconAnnouncement className="inline mr-1" /> */}
              {/* <span>Announcement</span> */}
            </span>
          </div>
          <div className="mb-3 mt-1">
            <span className="block font-bold text-lg leading-snug">{a.title}</span>
          </div>
          <div className="mb-1">
            <HtmlPreview html={a.message} className="prose max-w-none" />
          </div>
          {/* Announcement-specific comments */}
          {user && (
            <AnnouncementComments
              announcementId={a.id}
              allowComments={true}
              isLocked={false}
              currentUser={{ id: user.id, role: user.role || "student" }}
              courseId={courseId || ""}
            />
          )}
        </div>
      ))}
    </div>
  );
}
