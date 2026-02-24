"use client";
import React, { useState } from "react";
import { useUserContext } from "@/app/provider/user-context";
import OverviewTab from "./OverviewTab";
import AnnouncementsTab from "./AnnouncementsTab";
import ReviewsTab from "./ReviewsTab";
import LearningToolsTab from "./LearningToolsTab";
import CertificateView from "./CertificateView";
import { formatHMS } from "@/lib/utils";
import { Award } from "lucide-react";

interface TabsProps {
  course: any;
  instructor: any;
  organization: any;
  isCourseCompleted?: boolean;
  certificate?: any | null;
  studentId?: string;
  onCertificateIssued?: (cert: any) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Tabs({
  course,
  instructor,
  organization,
  isCourseCompleted = false,
  certificate = null,
  studentId,
  onCertificateIssued,
  activeTab: externalActiveTab,
  onTabChange,
}: TabsProps) {
  const { user } = useUserContext();

  const baseTabs = ["Overview", "Announcements"];
  const tabs = isCourseCompleted ? [...baseTabs] : baseTabs;

  const [internalActive, setInternalActive] = useState(tabs[0]);
  const active = externalActiveTab ?? internalActive;

  function handleTabChange(t: string) {
    setInternalActive(t);
    onTabChange?.(t);
  }

  // compute derived values (updated to use seconds)
  const lessonsCount = course?.lecture_count ?? 0;
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
            onClick={() => handleTabChange(t)}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors ${
              active === t
                ? "font-medium border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "Certificate" && (
              <Award className="w-3.5 h-3.5 text-amber-500" />
            )}
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
            <AnnouncementsTab courseId={course?.id} user={user} />
          </>
        )}
        {active === "Reviews" && <ReviewsTab />}
        {active === "Learning tools" && <LearningToolsTab />}
        {/* {active === "Certificate" && studentId && (
          <CertificateView
            certificate={certificate}
            studentId={studentId}
            courseId={course?.id}
            onCertificateIssued={onCertificateIssued}
          />
        )} */}
      </div>
    </div>
  );
}
