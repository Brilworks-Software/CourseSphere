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
    return <div className="h-full w-full flex justify-center items-center"><Loader /></div>;
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
        setCourse(data.course);
        setLessons(data.lessons);
        setEnrollment(data.enrollment);
        setLoading(false);
      });
  }, [id, user]);

  if ( loading || !user || !id) {
    return <div className="h-full w-full flex justify-center items-center"><Loader /></div>;
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

  // Show course content
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/courses"
          className="text-primary hover:underline mb-4 inline-block"
        >
          Back to courses student
        </Link>
        <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {course.description || "No description available"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lessons List */}
        <div className="lg:col-span-1">
          <h1>Lessons</h1>
          <div>
            <div className="space-y-2">
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <Link
                    key={lesson.id}
                    href={`/courses/${id}?lesson=${lesson.id}`}
                    className={`block p-3 rounded-md transition-colors ${
                      currentLesson?.id === lesson.id
                        ? "bg-accent/10 ring-1 ring-accent"
                        : "hover:bg-accent/5"
                    }`}
                  >
                    <div className="flex items-start">
                      <Play className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {index + 1}. {lesson.title}
                        </p>
                        {lesson.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {Math.floor(lesson.duration / 60)}:
                            {String(lesson.duration % 60).padStart(2, "0")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No lessons available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
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
            </CardContent>
          </Card>
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
