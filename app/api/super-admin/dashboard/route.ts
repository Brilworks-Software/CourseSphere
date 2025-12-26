import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = createClient();

    // Get total courses
    const { count: coursesCount } = await supabase
      .from("courses")
      .select("id", { count: "exact", head: true });

    // Get total users
    const { count: usersCount } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    // Get total enrollments
    const { count: enrollmentsCount } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true });

    // Get total organizations
    const { count: organizationsCount } = await supabase
      .from("organizations")
      .select("id", { count: "exact", head: true });

    // Get total lessons
    const { count: lessonsCount } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      coursesCount: coursesCount || 0,
      usersCount: usersCount || 0,
      enrollmentsCount: enrollmentsCount || 0,
      organizationsCount: organizationsCount || 0,
      lessonsCount: lessonsCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
