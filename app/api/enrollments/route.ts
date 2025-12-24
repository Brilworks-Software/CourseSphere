import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

async function getEnrolledCoursesForUser(userId?: string) {
  const supabase = await createClient();

  if (!userId) return [];

  // Join course, lessons count, and organization
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select(
      `
      course:course_id (
        *,
        lessons(count),
        organization:organization_id (
          id,
          name,
          slug,
          logo_url,
          thumbnail_url
        )
      )
    `
    )
    .eq("student_id", userId)
    .order("created_at", { ascending: false });

  console.log("Enrollments fetched for userId", userId, enrollments);

  if (error) {
    throw new Error(error.message);
  }

  // Map to just the course object, filtering out nulls
  const enrolledCourses =
    enrollments?.map((e: any) => e.course).filter(Boolean) || [];

  return enrolledCourses;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    console.log("Extracted userId from query param:", userId);

    const courses = await getEnrolledCoursesForUser(userId);
    console.log("Enrolled courses:", courses);

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("Error in GET /api/enrollments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
