import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

async function getEnrolledCoursesForUser(userId?: string) {
  const supabase = await createClient();

  // If userId is not provided, try to get current user from auth
  let id = userId;
  if (!id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    id = user?.id;
  }

  if (!id) return [];

  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const enrolledCourses =
    enrollments?.map((e: any) => e.course).filter(Boolean) || [];

  return enrolledCourses;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;

    const courses = await getEnrolledCoursesForUser(userId);

    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
