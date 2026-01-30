"use client";

import { BookOpen, Video, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";

export default function AdminDashboard() {
  const { user } = useUserContext();
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesCount, setCoursesCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [enrollmentsCount, setEnrollmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get instructor's courses
      const { data: fetchedCourses, count: fetchedCount } = await supabase
        .from("courses")
        .select(
          "*, organization:organization_id(id, name, slug, logo_url, thumbnail_url), lessons(count)",
          { count: "exact" }
        )
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      // Map organization to top-level key (same shape as list API)
      const mappedCourses = (fetchedCourses || []).map((course: any) => {
        const { organization, ...rest } = course;
        return {
          ...rest,
          organization: organization || null,
          // add isOwned flag so each course object matches list route shape
          isOwned: true,
        };
      });

      setCourses(mappedCourses);
      setCoursesCount(fetchedCount || 0);

      const courseIds = (mappedCourses || []).map((c: any) => c.id);

      // Get total videos count
      let videosCount = 0;
      if (courseIds.length > 0) {
        const { count } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .in("course_id", courseIds);
        videosCount = count || 0;
      }
      setVideosCount(videosCount);

      // Get enrollments for instructor's courses
      let enrollmentsCount = 0;
      if (courseIds.length > 0) {
        const { count } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .in("course_id", courseIds);
        enrollmentsCount = count || 0;
      }
      setEnrollmentsCount(enrollmentsCount);

      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const stats = [
    {
      name: "My Courses",
      value: coursesCount,
      icon: BookOpen,
    },
    {
      name: "Total Videos",
      value: videosCount,
      icon: Video,
    },
    {
      name: "Total Enrollments",
      value: enrollmentsCount,
      icon: Users,
    },
  ];

  // Extracted button for "No courses yet"
  let noCoursesButton = null;
  if (user?.organization_id) {
    noCoursesButton = (
      <Link href="/courses/new" className="no-underline">
        <Button>Create your first course</Button>
      </Link>
    );
  } else {
    noCoursesButton = (
      <Link href="/organization" className="no-underline">
        <Button>Create your Organization</Button>
      </Link>
    );
  }

  // Extracted role for CourseCard
  const courseCardRole = user?.role ?? undefined;

  // Extracted stat value display
  const getStatValue = (value: number) => (loading ? "..." : value);

  // Extracted courses grid content
  let coursesGridContent;
  if (loading) {
    coursesGridContent = (
      <div className="text-center py-16 text-muted-foreground"><Loader /></div>
    );
  } else if (courses && courses.length > 0) {
    coursesGridContent = (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            role={courseCardRole}
            context="dashboard-admin"
          />
        ))}
      </div>
    );
  } else {
    coursesGridContent = (
      <div className="text-center py-16">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2 text-lg font-medium">
          No courses yet
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Get started by creating your first course
        </p>
        {noCoursesButton}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Instructor Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your courses and track engagement
            </p>
          </div>
        </div>

        {/* Use shadcn Button for primary action */}
        <Link href="/courses/new" className="no-underline">
          <Button>Create Course</Button>
        </Link>
      </div>

      {/* Stats Grid (no Card wrapper per-item) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl shadow-md border border-muted p-4 bg-card dark:bg-card-dark"
          >
            <div className="flex items-center">
              <div className="p-4 rounded-lg border border-muted bg-muted/6">
                <stat.icon className="h-6  w-6  text-accent-foreground" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {getStatValue(stat.value)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className=" py-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">My Courses</h2>
          <Link href="/dashboard/courses" className="no-underline">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>

        <div>{coursesGridContent}</div>
      </div>
    </div>
  );
}
