"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";
import EnrollmentView from "@/components/course/EnrollmentView";
import EnrolledView from "@/components/course/EnrolledView";

export default function StudentSingleCourse({
  id,
  searchParams,
}: {
  id: string;
  searchParams?: { lesson?: string } | Promise<{ lesson?: string }>;
}) {
  // --- Use next/navigation for URL state management ---
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  // Always derive lessonId from URL for true sync
  const lessonIdFromUrl = urlSearchParams?.get("lesson") || undefined;

  const { user } = useUserContext();

  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Progress & certificate state ---
  // Keyed by lesson_id: { is_completed: boolean }
  const [lessonProgress, setLessonProgress] = useState<
    Record<string, { is_completed: boolean }>
  >({});
  const [certificate, setCertificate] = useState<any | null>(null);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);

  // --- Signed video URL logic ---
  const [signedVideoUrl, setSignedVideoUrl] = useState<string>("");
  const [signedUrlExpiry, setSignedUrlExpiry] = useState<number>(0);
  const [lastLessonId, setLastLessonId] = useState<string | undefined>(
    undefined
  );

  const isEnrolled = !!enrollment;
  // Get all lessons
  const allLessons = useMemo(
    () => sections.flatMap((s: any) => s.lessons || []),
    [sections]
  );
  // Compute current lesson from URL or default to first lesson
  const currentLesson = useMemo(() => {
    if (!allLessons.length) return undefined;
    return lessonIdFromUrl
      ? allLessons.find((l: any) => l.id === lessonIdFromUrl) || allLessons[0]
      : allLessons[0];
  }, [allLessons, lessonIdFromUrl]);

  // Helper to extract S3 key from video_url
  function extractS3Key(videoUrl: string) {
    const match = videoUrl.match(/s3\.ap-south-1\.amazonaws\.com\/(.+)$/);
    return match ? match[1] : "";
  }

  // Fetch signed video URL when currentLesson changes
  useEffect(() => {
    if (!currentLesson?.video_url) {
      setSignedVideoUrl("");
      setSignedUrlExpiry(0);
      setLastLessonId(undefined);
      return;
    }
    if (
      lastLessonId === currentLesson.id &&
      signedVideoUrl &&
      signedUrlExpiry > Date.now()
    ) {
      return;
    }
    const s3Key = extractS3Key(currentLesson.video_url);
    if (!s3Key) {
      setSignedVideoUrl("");
      setSignedUrlExpiry(0);
      setLastLessonId(undefined);
      return;
    }
    fetch("/api/s3/download-url", {
      method: "POST",
      body: JSON.stringify({ key: s3Key }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSignedVideoUrl(data.signedUrl);
        setSignedUrlExpiry(Date.now() + 60 * 60 * 1000); // 1 hour expiry
        setLastLessonId(currentLesson.id);
      });
  }, [
    currentLesson?.video_url,
    currentLesson?.id,
    lastLessonId,
    signedVideoUrl,
    signedUrlExpiry,
  ]);

  // -------------------------------------------------------
  // Record lesson "open" event whenever the active lesson changes
  // -------------------------------------------------------
  useEffect(() => {
    if (!currentLesson?.id || !user?.id || !id) return;

    fetch("/api/student/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: user.id,
        courseId: id,
        lessonId: currentLesson.id,
        sectionId: currentLesson.section_id || null,
        action: "open",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.progress) {
          setLessonProgress((prev) => ({
            ...prev,
            [currentLesson.id]: {
              is_completed: data.progress.is_completed,
            },
          }));
        }
      })
      .catch(() => {});
  }, [currentLesson?.id, user?.id, id]);

  // -------------------------------------------------------
  // Handler: mark current lesson as complete
  // -------------------------------------------------------
  const handleMarkComplete = useCallback(
    async (lessonId: string) => {
      if (!user?.id || !id) return;

      const res = await fetch("/api/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          courseId: id,
          lessonId,
          sectionId:
            allLessons.find((l: any) => l.id === lessonId)?.section_id ||
            null,
          action: "complete",
        }),
      });
      const data = await res.json();

      if (data.progress) {
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId]: { is_completed: true },
        }));
      }

      if (data.isCourseCompleted) {
        setIsCourseCompleted(true);
        // Auto-issue certificate
        fetch("/api/student/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: user.id, courseId: id }),
        })
          .then((r) => r.json())
          .then((certData) => {
            if (certData.certificate) {
              setCertificate(certData.certificate);
            }
          })
          .catch(() => {});
      }
    },
    [user?.id, id, allLessons]
  );

  // -------------------------------------------------------
  // Handler: lesson change via sidebar
  // -------------------------------------------------------
  const handleLessonChange = useCallback(
    (lessonId: string) => {
      const params = new URLSearchParams(urlSearchParams?.toString() || "");
      params.set("lesson", lessonId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, urlSearchParams]
  );

  // Guard clause
  if (!id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // -------------------------------------------------------
  // Fetch course + progress + certificate on mount
  // -------------------------------------------------------
  useEffect(() => {
    if (!user || !id) return;
    setLoading(true);

    // Parallel fetch: course data + lesson progress + existing certificate
    Promise.all([
      fetch(`/api/student/courses?courseId=${id}&studentId=${user.id}`).then(
        (r) => r.json()
      ),
      fetch(
        `/api/student/progress?studentId=${user.id}&courseId=${id}`
      ).then((r) => r.json()),
      fetch(
        `/api/student/certificates?studentId=${user.id}&courseId=${id}`
      ).then((r) => r.json()),
    ])
      .then(([courseData, progressData, certData]) => {
        setCourse(courseData);
        setSections(courseData.sections || []);
        setEnrollment(courseData.enrollment);

        // Build progress map from DB
        const progressMap: Record<string, { is_completed: boolean }> = {};
        for (const row of progressData?.progress || []) {
          progressMap[row.lesson_id] = { is_completed: row.is_completed };
        }
        setLessonProgress(progressMap);

        // Certificate
        if (certData?.certificate) {
          setCertificate(certData.certificate);
          setIsCourseCompleted(true);
        } else {
          // Compute course completion from progress
          const allLessonsFlat = (courseData.sections || []).flatMap(
            (s: any) => s.lessons || []
          );
          const total = allLessonsFlat.length;
          const completed = Object.values(progressMap).filter(
            (p) => p.is_completed
          ).length;
          if (total > 0 && completed >= total) {
            setIsCourseCompleted(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading || !user || !id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  const totalDurationSeconds =
    allLessons?.reduce((acc: number, l: any) => acc + (l?.duration || 0), 0) ||
    0;

  const formatDuration = (secs: number) => {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // If student and not enrolled, show enrollment option
  if (user?.role === "student" && !isEnrolled) {
    return (
      <EnrollmentView
        course={course}
        allLessons={allLessons}
        totalDurationSeconds={totalDurationSeconds}
        formatDuration={formatDuration}
        id={id}
        user={user}
      />
    );
  }

  // Enrolled view: show CourseHeader, video + tabs and lessons list
  return (
    <EnrolledView
      course={course}
      instructor={course?.instructor}
      organization={course?.organization}
      currentLesson={currentLesson}
      allLessons={allLessons}
      signedVideoUrl={signedVideoUrl}
      sections={sections}
      setLessonId={handleLessonChange}
      lessonProgress={lessonProgress}
      isCourseCompleted={isCourseCompleted}
      certificate={certificate}
      studentId={user.id}
      onMarkComplete={handleMarkComplete}
      onCertificateIssued={(cert) => setCertificate(cert)}
    />
  );
}
