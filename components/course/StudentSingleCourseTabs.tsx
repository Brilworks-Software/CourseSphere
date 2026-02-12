"use client";
import React, { useState } from "react";
import { useUserContext } from "@/app/provider/user-context";
import OverviewTab from "./OverviewTab";
import AnnouncementsTab from "./AnnouncementsTab";
import ReviewsTab from "./ReviewsTab";
import LearningToolsTab from "./LearningToolsTab";
import { formatHMS } from "@/lib/utils";


export default function Tabs({ course, instructor, organization }: any) {
  const { user } = useUserContext();
  const tabs = ["Overview", "Announcements"];
  // const tabs = ["Overview", "Announcements", "Reviews", "Learning tools"];
  const [active, setActive] = useState(tabs[0]);

  // compute derived values (updated to use seconds)
  const lessonsCount = (course?.lecture_count) ?? 0;
  const formattedTotal = formatHMS(course?.total_video_time ?? 0);
  const reviewsCount = Number(course?.reviews_count ?? 0);
  const studentsCount = Number(course?.students_count ?? (course?.enrollment ? 1 : 0));
  const rating = course?.rating ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b pb-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1 text-sm rounded ${active === t ? "font-medium border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        {active === "Overview" && (
          <OverviewTab
            course={course}
            instructor={instructor}
            organization={organization}
            lessonsCount={lessonsCount}
            formattedTotal={formattedTotal}
            rating={rating}
            reviewsCount={reviewsCount}
            studentsCount={studentsCount}
            lecture_count={lessonsCount}
            total_video_time={formattedTotal}
          />
        )}
        {active === "Announcements" && (
          <>
            <AnnouncementsTab
              courseId={course?.id}
              user={user}
            />
          </>
        )}
        {active === "Reviews" && <ReviewsTab />}
        {active === "Learning tools" && <LearningToolsTab />}
      </div>
    </div>
  );
}
