"use client";
import React, { useState } from "react";
import OverviewTab from "./OverviewTab";
import AnnouncementsTab from "./AnnouncementsTab";
import ReviewsTab from "./ReviewsTab";
import LearningToolsTab from "./LearningToolsTab";

// helpers
function totalSecondsFromCourse(course: any) {
  try {
    const lessons = course?.lessons ?? [];
    if (!lessons.length) return 0;

    // Sum raw durations (unknown unit)
    const sumRaw = lessons.reduce((sum: number, l: any) => sum + (Number(l.duration) || 0), 0);
    const avgRaw = sumRaw / lessons.length;

    // Heuristic:
    // - If average raw duration > 10 -> likely durations are in seconds (e.g. 60, 120).
    // - Otherwise treat raw as minutes.
    const likelySeconds = avgRaw > 10;

    if (likelySeconds) {
      // durations are seconds already
      return Math.round(sumRaw);
    } else {
      // durations provided as minutes -> convert to seconds
      return Math.round(sumRaw * 60);
    }
  } catch (e) {
    return 0;
  }
}

function formatHMS(totalSeconds: number) {
  if (totalSeconds === null || totalSeconds === undefined) return "—";
  if (totalSeconds <= 0) return "0s";

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  // Build a compact label depending on available units
  if (h > 0) {
    // include seconds only if no minutes (rare) or you want finer detail; keep h and m
    return s ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  if (m > 0) {
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  return `${s}s`;
}

export default function Tabs({ course, instructor, organization }: any) {
  const tabs = ["Overview", "Announcements", "Reviews", "Learning tools"];
  const [active, setActive] = useState(tabs[0]);

  // compute derived values (updated to use seconds)
  const lessonsCount = (course?.lessons ?? []).length;
  const totalSeconds = totalSecondsFromCourse(course);
  const formattedTotal = formatHMS(totalSeconds);
  const reviewsCount = Number(course?.reviews_count ?? 0);
  const studentsCount = Number(course?.students_count ?? (course?.enrollment ? 1 : 0));
  const rating = course?.rating ?? 4.4;

  // small formatter
  const nf = new Intl.NumberFormat();

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
          />
        )}
        {active === "Announcements" && <AnnouncementsTab />}
        {active === "Reviews" && <ReviewsTab />}
        {active === "Learning tools" && <LearningToolsTab />}
      </div>
    </div>
  );
}
