"use client";
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";

export default function CoursesPage() {
  const { user } = useUserContext();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("User in CoursesPage:", user);

  useEffect(() => {
    if (!user || !user.id) return; // Only fetch if user is available

    async function fetchCourses() {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses?userId=${user?.id}`, {
          method: "GET",
        });
        const data = await res.json();
        setCourses(data || []);
      } catch (err) {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [user]); // Depend on user

  // For now, assume no enrollments
  const enrolledCourseIds = new Set();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Courses page</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse and enroll in courses
        </p>
      </div>

      {loading ? (
        <div className="h-full w-full flex justify-center items-center">
          <Loader />
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                role={typeof user?.role === "string" ? user.role : undefined}
                context="public"
                isEnrolled={isEnrolled}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No courses available at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
