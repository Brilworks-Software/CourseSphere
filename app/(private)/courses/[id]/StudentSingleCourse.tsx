"use client";
import { useEffect, useState } from "react";
import { Play, Clock, User } from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";

export default function StudentSingleCourse({
  id,
  searchParams,
}: {
  id: string;
  searchParams?: { lesson?: string } | Promise<{ lesson?: string }>;
}) {
  // Guard clause: don't render or fetch if id is not available
  if (!id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // --- FIX: unwrap searchParams if it's a Promise ---
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (searchParams instanceof Promise) {
      searchParams.then((params) => {
        if (!cancelled) setLessonId(params?.lesson);
      });
    } else {
      setLessonId(searchParams?.lesson);
    }
    return () => {
      cancelled = true;
    };
  }, [searchParams]);
  // --------------------------------------------------

  const { user } = useUserContext();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // new thumbnail states for improved UX
  const [isThumbOpen, setIsThumbOpen] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(true);
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    // Only fetch if user and id are available
    if (!user || !id) return;
    setLoading(true);
    fetch(`/api/student/courses?courseId=${id}&studentId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data);
        setLessons(data.lessons);
        setEnrollment(data.enrollment);
        setLoading(false);
      });
  }, [id, user]);

  // close modal on Escape
  useEffect(() => {
    if (!isThumbOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsThumbOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isThumbOpen]);

  if (loading || !user || !id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  const isEnrolled = !!enrollment;

  // Get current lesson
  const currentLesson = lessonId
    ? lessons?.find((l: any) => l.id === lessonId)
    : lessons?.[0];

  // compute total duration (seconds) and formatter
  const totalDurationSeconds =
    lessons?.reduce((acc: number, l: any) => acc + (l?.duration || 0), 0) || 0;

  const formatDuration = (secs: number) => {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // If student and not enrolled, show enrollment option (enhanced)
  if (user?.role === "student" && !isEnrolled) {
    const instr = course?.instructor || {};
    const instructorName =
      instr?.first_name || instr?.name || instr?.email || "Unknown Instructor";
    const instructorEmail = instr?.email || "";
    const instructorAvatar = instr?.profile_picture_url || instr?.avatar_url;

    // compute first lesson preview and formatted duration
    const firstLesson = lessons?.[0];
    const firstLessonDuration = firstLesson?.duration
      ? `${Math.floor(firstLesson.duration / 60)}:${String(
          firstLesson.duration % 60
        ).padStart(2, "0")}`
      : null;

    return (
      <div className=" px-4 sm:px-6 lg:px-8 py-8">
        <Card className=" mx-auto">
          {/* UPDATED: show thumbnail next to title/description */}
          <CardHeader>
            <div className="flex items-start gap-4">
              {course?.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course?.title || "Course Thumbnail"}
                  loading="lazy"
                  onError={(e) => {
                    // fallback to a neutral placeholder if image fails
                    (e.currentTarget as HTMLImageElement).src =
                      "https://ui-avatars.com/api/?name=Course&background=ddd&color=555&size=128";
                  }}
                  className="h-62 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="w-28 h-20 bg-muted flex items-center justify-center rounded-md text-sm text-muted-foreground flex-shrink-0">
                  No thumbnail
                </div>
              )}

              <div>
                <CardTitle>{course.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {course.description || "No description available"}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instructor Card — expanded with contact and bio */}
              <div className="col-span-1 border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={
                      instructorAvatar ||
                      "https://ui-avatars.com/api/?name=I&background=ddd&color=555&size=64"
                    }
                    alt={instructorName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-foreground">
                          {instructorName}
                        </div>
                        {instr?.last_name && (
                          <div className="text-xs text-muted-foreground">
                            {instr.last_name}
                          </div>
                        )}
                        {instructorEmail && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <a
                              href={`mailto:${instructorEmail}`}
                              className="underline"
                            >
                              {instructorEmail}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Instructor
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-3">
                      {instr?.bio || "No bio available"}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {instructorEmail && (
                        <a
                          href={`mailto:${instructorEmail}`}
                          className="text-sm underline text-primary"
                          aria-label={`Contact ${instructorName}`}
                        >
                          Contact
                        </a>
                      )}
                      {instr?.id && (
                        <Link
                          href={`/instructors/${instr.id}`}
                          className="text-sm underline text-muted-foreground"
                        >
                          View profile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Summary — enhanced */}
              <div className="col-span-2 md:col-span-2 border rounded-lg p-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Lessons</div>
                    <div className="font-medium text-foreground">
                      {lessons?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Duration
                    </div>
                    <div className="font-medium text-foreground">
                      {formatDuration(totalDurationSeconds)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="font-medium text-foreground">
                      {course?.is_free ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>₹{course?.price}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* First lesson preview */}
                <div className="mt-2 border rounded-md p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Preview lesson
                      </div>
                      <div className="font-medium text-foreground">
                        {firstLesson
                          ? `${firstLesson.title}`
                          : "No preview available"}
                      </div>
                      {firstLessonDuration && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 inline" />
                          {firstLessonDuration}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <EnrollButton
                    courseId={id}
                    userId={user.id}
                    isFree={!!course?.is_free}
                    price={course?.price}
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {course?.is_free
                      ? "This course is free — enroll now to get immediate access."
                      : "Secure checkout — you will get full access to all lessons after enrolling."}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redesigned UI: Org banner, logo, course thumbnail, vertical lessons, no hardcoded colors
  return (
    <div className="space-y-8">
      {/* Course Thumbnail and Info */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row relative">
          {/* Course Thumbnail */}
          {/* CLICKABLE, LAZY loading thumbnail with placeholder and modal */}
          {course?.thumbnail_url ? (
            <div className="md:w-1/2 w-full aspect-video bg-muted flex items-center justify-center relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsThumbOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setIsThumbOpen(true);
                }}
                aria-label="Open course thumbnail"
                className="w-full h-full cursor-pointer relative"
              >
                {thumbLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 animate-pulse rounded bg-muted-foreground/30" />
                  </div>
                )}
                <img
                  src={course.thumbnail_url}
                  alt={course?.title || "Course Thumbnail"}
                  loading="lazy"
                  onLoad={() => setThumbLoading(false)}
                  onError={() => {
                    setThumbLoading(false);
                    setThumbError(true);
                  }}
                  className="object-cover w-full h-full rounded-none"
                />
                {!thumbError && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/40 text-white px-3 py-1 rounded-full text-sm">
                      View
                    </div>
                  </div>
                )}
                {thumbError && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Image unavailable
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="md:w-1/2 w-full aspect-video bg-muted flex items-center justify-center">
              <div className="text-sm text-muted-foreground">No thumbnail</div>
            </div>
          )}

          {/* Thumbnail lightbox/modal */}
          {isThumbOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setIsThumbOpen(false)}
              aria-hidden={!isThumbOpen}
            >
              <div
                className="max-w-5xl max-h-[80vh] w-full p-2 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsThumbOpen(false)}
                  aria-label="Close thumbnail"
                  className="absolute top-2 right-2 text-white text-2xl leading-none"
                >
                  ×
                </button>
                <img
                  src={course.thumbnail_url}
                  alt={course?.title || "Course Thumbnail"}
                  className="object-contain w-full h-full rounded-lg shadow-lg bg-black"
                />
              </div>
            </div>
          )}
          <div className=" flex-1 p-6 flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {course?.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                Category:{" "}
                <span className="font-medium text-foreground">
                  {course?.primary_category || "-"}
                </span>
              </span>
              <span>
                Subcategory:{" "}
                <span className="font-medium text-foreground">
                  {course?.sub_category || "-"}
                </span>
              </span>
              <span>
                Lessons:{" "}
                <span className="font-medium text-foreground">
                  {lessons.length}
                </span>
              </span>
              <span>
                Status:{" "}
                <span className="font-medium text-foreground">
                  {course?.is_active ? "Active" : "Inactive"}
                </span>
              </span>
              <span>
                Created:{" "}
                <span className="font-medium text-foreground">
                  {course?.created_at
                    ? new Date(course.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </span>
              <span>
                {course?.is_free ? (
                  <span className="font-semibold">Free</span>
                ) : (
                  <span className="font-semibold">₹{course?.price}</span>
                )}
              </span>
            </div>
            <p className="text-base mt-2 text-muted-foreground">
              {course?.description || "No description available"}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Content: Lessons (vertical) + Video */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lessons List (vertical, clean) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {lessons && lessons.length > 0 ? (
                  lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${id}?lesson=${lesson.id}`}
                      className={`group border rounded-lg px-4 py-3 flex items-center gap-4 transition hover:bg-accent/30 ${
                        currentLesson?.id === lesson.id
                          ? "ring-2 ring-primary bg-accent/10"
                          : ""
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                        <Play className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground group-hover:underline">
                          {index + 1}. {lesson.title}
                        </div>
                        {lesson.duration && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 inline" />
                            {Math.floor(lesson.duration / 60)}:
                            {String(lesson.duration % 60).padStart(2, "0")}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No lessons available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4">
              {currentLesson && lessons ? (
                <VideoPlayer
                  lesson={currentLesson}
                  lessons={lessons}
                  courseId={id}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No lessons available for this course
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Organization Banner */}
      <div className="relative w-full superUltraWide-container max-h-76 overflow-hidden  rounded-2xl bg-muted mb-8">
        <div className="w-full rounded-2xl ">
          <img
            src={
              course?.organization?.thumbnail_url
                ? course.organization.thumbnail_url
                : // : "https://ryqoufhmjoxlbwozmhxv.supabase.co/storage/v1/object/public/assets-bucket/public/thumbnails/1766731358001_thumnail%202.jpg"
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSNDKb6szpfNfLfPHEk6VIVryrF3k3XJJWPw&s"
            }
            alt="Banner"
            className="object-contain w-full h-full  "
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        <div className="absolute bottom-4 left-6 w-full rounded-lg overflow-hidden">
          {course.organization?.logo_url && (
            <div>
              <p className="text-2xl">A Course By</p>
              <div className="flex items-center">
                <img
                  src={course.organization?.logo_url}
                  alt={course.organization.name}
                  className="w-32 h-32 rounded-lg object-cover border-2 border-background shadow-lg bg-background"
                  style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)" }}
                />
                <div className="ml-4">
                  <div className="font-bold text-lg sm:text-2xl text-foreground">
                    {course.organization.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Org slug: {course.organization.slug}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EnrollButton({
  courseId,
  userId,
  isFree,
  price,
}: {
  courseId: string;
  userId: string;
  isFree?: boolean;
  price?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const handleEnroll = async () => {
    setLoading(true);
    try {
      await fetch("/api/student/courses/enroll", {
        method: "POST",
        body: JSON.stringify({ courseId, userId }),
        headers: { "Content-Type": "application/json" },
      });
      // reload to reflect enrollment immediately
      window.location.reload();
    } catch (err) {
      // silence errors for now; could show toast
      setLoading(false);
    }
  };
  return (
    <Button
      type="button"
      className="w-full"
      onClick={handleEnroll}
      disabled={loading}
    >
      {loading
        ? "Enrolling..."
        : isFree
        ? "Enroll for Free"
        : price
        ? `Enroll — ₹${price}`
        : "Enroll in Course"}
    </Button>
  );
}
