import Link from "next/link";
import EnrolledCoursesClient from "@/components/enrolled-courses-client";
import StudentLiveList from "@/components/StudentLiveList";

export default function StudentDashboard() {
  return (
    <div className="space-y-8 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Continue learning from your enrolled courses
            </p>
          </div>
        </div>
      </div>

      {/* Enrolled Courses (removed outer card; use admin-style articles) */}
      <div>
        <StudentLiveList />
        <EnrolledCoursesClient />
      </div>
    </div>
  );
}
