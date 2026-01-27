"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trash2, Video, Pencil } from "lucide-react";
import Link from "next/link";
import { ManageCourseForm } from "@/components/manage-course-form";
import { AddLessonForm } from "@/components/add-lesson-form";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";

export default function AdminSingleCourse({ id }: { id: string }) {
  const { user } = useUserContext();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetchCourseAndLessons = async () => {
      const supabase = createClient();
      // Get course
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      if (!courseData) {
        router.replace("/dashboard/courses");
        return;
      }
      // Check if user has access (admin can only edit their own courses)
      if (user.role === "admin" && courseData.instructor_id !== user.id) {
        router.replace("/dashboard/courses");
        return;
      }
      setCourse(courseData);

      // Get lessons
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("created_at", { ascending: true });
      setLessons(lessonsData || []);
    };
    fetchCourseAndLessons();
  }, [user, , id, router]);

  if (!user || !course) {
    return <div className="h-full w-full flex justify-center items-center"><Loader /></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Link
          href="/dashboard/courses"
          className="text-primary hover:opacity-90 mb-4 inline-block"
        >
          Back to courses
        </Link>
        <h1 className="text-3xl font-bold text-foreground">
          Manage Course Admin
        </h1>
      </div>

      {/* Course Details — show a compact summary and open form in a modal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left column: sticky, spans 2 cols on md+ */}
        <div className="md:col-span-2">
          <div className="sticky top-20 self-start">
            <div className="flex flex-col items-start gap-8">
              {/* Thumbnail */}
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title || "Course thumbnail"}
                  className="w-full md:w-auto h-56 md:h-96 object-cover rounded-md border shadow-2xl"
                />
              ) : (
                <div className="w-96 h-44 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground border">
                  No image
                </div>
              )}

              {/* Title + short description */}
              <div className="space-y-2">
                <Badge variant={course.is_active ? "default" : "destructive"}>
                  {course.is_active ? "Active" : "Inactive"}
                </Badge>
                <h2 className="text-4xl font-bold text-card-foreground">
                  {course.title}
                </h2>
                {course.description ? (
                  <p className="text-sm text-muted-foreground max-w-xl">
                    {course.description.length > 140
                      ? course.description.slice(0, 140) + "…"
                      : course.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No description
                  </p>
                )}
                {/* Right column: status + edit button */}
                <div className="flex flex-col w-fit gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        className="border border-primary"
                        size="sm"
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl sm:max-w-7xl max-h-[90vh] overflow-y-auto">
                      <DialogTitle>Edit Course</DialogTitle>
                      <ManageCourseForm course={course} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: playlist-like, scrollable */}
        <aside className="md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              Lessons
            </h2>
            <AddLessonForm courseId={id} />
          </div>

          <div className="p-2 rounded-lg border border-border max-h-[calc(100vh-7rem)] overflow-y-auto">
            {lessons && lessons.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-3 py-3 hover:bg-muted/40 transition"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-card-foreground line-clamp-2 overflow-hidden leading-tight">
                          {lesson.title}
                        </h3>
                        {lesson.duration && (
                          <p className="text-sm text-muted-foreground">
                            Duration: {Math.floor(lesson.duration / 60)}:
                            {String(lesson.duration % 60).padStart(2, "0")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <DeleteLessonButton
                        lessonId={lesson.id}
                        onDeleted={() => {
                          setLessons((prev) =>
                            prev.filter((l) => l.id !== lesson.id)
                          );
                        }}
                        user={user}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No lessons yet. Add your first lesson to get started.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// DeleteLessonButton now uses client-side API call
function DeleteLessonButton({
  lessonId,
  onDeleted,
  user,
}: {
  lessonId: string;
  onDeleted: () => void;
  user: any;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const res = await fetch("/api/admin/courses/delete-lesson", {
      method: "POST",
      body: JSON.stringify({ lessonId }),
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    if (res.ok) {
      onDeleted();
    } else {
      alert("Failed to delete lesson");
    }
  };

  return (
    <form onSubmit={handleDelete}>
      <Button
        variant="destructive"
        size="icon"
        type="submit"
        title="Delete lesson"
        aria-label="Delete lesson"
        className="h-9 w-9"
        disabled={loading}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
