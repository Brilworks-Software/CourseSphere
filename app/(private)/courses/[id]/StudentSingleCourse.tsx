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

  // If student and not enrolled, show enrollment option
  if (user?.role === "student" && !isEnrolled) {
    return (
      <div className=" px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
            {/* optional description */}
            <p className="text-sm text-muted-foreground mt-2">
              {course.description || "No description available"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {/* Use only user data, not instructor/profile */}
                <span>Instructor: {course.instructor_name || "Unknown"}</span>
              </div>
              <div>Lessons: {lessons?.length || 0}</div>
            </div>
            <EnrollButton courseId={id} userId={user.id} />
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
          {course?.thumbnail_url && (
            <div className="md:w-1/2 w-full aspect-video bg-muted flex items-center justify-center">
              <img
                src={course.thumbnail_url}
                alt={course?.title || "Course Thumbnail"}
                className="object-cover w-full h-full rounded-none"
              />
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
        {course?.organization?.thumbnail_url && (
          <div className="w-full rounded-2xl ">
            {course.organization?.thumbnail_url ? (
              <img
                src={course.organization?.thumbnail_url}
                alt="Banner"
                className="object-contain w-full h-full  "
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No banner image
              </div>
            )}
          </div>
        )}
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
}: {
  courseId: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const handleEnroll = async () => {
    setLoading(true);
    await fetch("/api/student/courses/enroll", {
      method: "POST",
      body: JSON.stringify({ courseId, userId }),
      headers: { "Content-Type": "application/json" },
    });
    window.location.reload();
  };
  return (
    <Button
      type="button"
      className="w-full"
      onClick={handleEnroll}
      disabled={loading}
    >
      {loading ? "Enrolling..." : "Enroll in Course"}
    </Button>
  );
}
