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

  // --- Signed video URL logic ---
  const [signedVideoUrl, setSignedVideoUrl] = useState<string>("");
  const [signedUrlExpiry, setSignedUrlExpiry] = useState<number>(0);
  const [lastLessonId, setLastLessonId] = useState<string | undefined>(undefined);

  const isEnrolled = !!enrollment;
  // Get all lessons
  const allLessons = useMemo(
    () => sections.flatMap((s: any) => s.lessons || []),
    [sections]
  );
  // Compute current lesson from URL or default to first lesson
  const currentLesson = useMemo(() => {
    if (!allLessons.length) return undefined;
    // If lessonIdFromUrl is not found, fallback to first lesson
    return lessonIdFromUrl
      ? allLessons.find((l: any) => l.id === lessonIdFromUrl) || allLessons[0]
      : allLessons[0];
  }, [allLessons, lessonIdFromUrl]);

  // Helper to extract S3 key from video_url
  function extractS3Key(videoUrl: string) {
    // Example: https://bril-course-media.s3.ap-south-1.amazonaws.com/videos/1770101885147-xxx.mp4
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
    // Only refetch if lesson changed or URL expired
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
  }, [currentLesson?.video_url, currentLesson?.id, lastLessonId, signedVideoUrl, signedUrlExpiry]);


  // Handler to change lesson (updates URL)
  // Memoized handler to avoid unnecessary rerenders
  const handleLessonChange = useCallback(
    (lessonId: string) => {
      const params = new URLSearchParams(urlSearchParams?.toString() || "");
      params.set("lesson", lessonId);
      router.replace(`?${params.toString()}`, { scroll: false });
      // No need to set state, as currentLesson is derived from URL
    },
    [router, urlSearchParams]
  );

  // Guard clause: don't render or fetch if id is not available
  if (!id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  useEffect(() => {
    // Only fetch if user and id are available
    if (!user || !id) return;
    setLoading(true);
    fetch(`/api/student/courses?courseId=${id}&studentId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data);
        setSections(data.sections || []);
        setEnrollment(data.enrollment);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, user]);
  if (loading || !user || !id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // compute total duration (seconds) and formatter
  const totalDurationSeconds =
    allLessons?.reduce((acc: number, l: any) => acc + (l?.duration || 0), 0) || 0;

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
      id={id}
      signedVideoUrl={signedVideoUrl}
      sections={sections}
      setLessonId={handleLessonChange}
    />
  );
}

