"use client";

import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { useUserContext } from "@/app/provider/user-context";
import { useEffect, useState } from "react";

export default function CoursesManagementPage() {
  const { user } = useUserContext();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        if (!user || !user.id || !user.role) {
          setCourses([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/admin/courses?role=${encodeURIComponent(user.role)}&userId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        setCourses(data.courses || []);
      } catch (err) {
        // Optionally log error
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    if (user && user.id && user.role) fetchCourses();
  }, [user]);

  let content;
  if (loading) {
    content = (
      <div className="text-center py-12 bg-card rounded-lg shadow">
        <p className="text-muted-foreground mb-4">Loading courses...</p>
      </div>
    );
  } else if (courses && courses.length > 0) {
    content = (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course: any) => (
          <CourseCard
            key={course.id}
            course={course}
            role={user?.role ? String(user.role) : undefined}
            context="dashboard-admin"
          />
        ))}
      </div>
    );
  } else {
    content = (
      <div className="text-center py-12 bg-card rounded-lg shadow">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">No courses found.</p>
        <Link href="/courses/new" className="text-accent hover:underline">
          Create your first course
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Course Management
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your courses and lessons
            </p>
          </div>
        </div>
        <Link
          href="/courses/new"
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:opacity-95 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Course</span>
        </Link>
      </div>
      {content}
    </div>
  );
}
