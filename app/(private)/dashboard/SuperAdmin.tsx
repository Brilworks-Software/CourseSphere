import { createClient } from "@/lib/supabase/client";
import { Users, BookOpen, Video, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const supabase = await createClient();

  // Get statistics
  const [usersResult, coursesResult, lessonsResult, enrollmentsResult] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("lessons").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
    ]);

  const { data: courses } = await supabase
    .from("courses")
    .select("is_active")
    .then((res) => res);

  const activeCourses = courses?.filter((c) => c.is_active).length || 0;
  const inactiveCourses = (coursesResult.count || 0) - activeCourses;

  // Get recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Get recent courses
  const { data: recentCourses } = await supabase
    .from("courses")
    .select("*, instructor:profiles!courses_instructor_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const stats = [
    {
      name: "Total Users",
      value: usersResult.count || 0,
      icon: Users,
    },
    {
      name: "Total Courses",
      value: coursesResult.count || 0,
      icon: BookOpen,
    },
    {
      name: "Total Videos",
      value: lessonsResult.count || 0,
      icon: Video,
    },
    {
      name: "Total Enrollments",
      value: enrollmentsResult.count || 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Super Admin Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Overview of platform statistics and management
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-muted/6">
                <stat.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Status */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Course Status
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Courses</span>
              <span className="font-semibold text-success">
                {activeCourses}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inactive Courses</span>
              <span className="font-semibold text-destructive">
                {inactiveCourses}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-card rounded-lg shadow">
        <div className="px-6 py-4 border-b border-muted">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Users
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/4">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-muted">
              {recentUsers?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {user.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-muted/6 text-muted-foreground">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-card rounded-lg shadow">
        <div className="px-6 py-4 border-b border-muted flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Courses
          </h2>
          <Link
            href="/dashboard/courses"
            className="text-sm text-accent hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/4">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-muted">
              {recentCourses?.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {course.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(course.instructor as any)?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        course.is_active
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {course.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(course.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
