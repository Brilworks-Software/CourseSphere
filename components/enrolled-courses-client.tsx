"use client";

import { useEffect, useState } from "react";
import CourseCarousel from "./course-carousel";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useUserContext } from "@/app/provider/user-context";

export default function EnrolledCoursesClient() {
  const { user } = useUserContext();
  const [courses, setCourses] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchEnrollments() {
      try {
        const res = await fetch(`/api/enrollments?userId=${user?.id ?? ""}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });

        if (!res.ok) {
          // Try parse error message if available
          const json = await res.json().catch(() => null);
          throw new Error(
            json?.error || res.statusText || "Failed to fetch enrollments"
          );
        }

        const data = await res.json();
        if (mounted) setCourses(data || []);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEnrollments();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading)
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">Loading enrolled courses…</div>
      </div>
    );

  if (error)
    return <div className="text-center py-12 text-destructive">{error}</div>;

  if (!courses || courses.length === 0)
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          You haven't enrolled in any courses yet.
        </p>
        <Link href="/courses" className="text-accent hover:underline">
          Browse available courses
        </Link>
      </div>
    );

  return (
    <CourseCarousel
      courses={courses}
      role="student"
      context="dashboard-student"
      isEnrolled
    />
  );
}
