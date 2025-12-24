import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const studentId = searchParams.get("studentId");

    if (!courseId || !studentId) {
      return NextResponse.json(
        { error: "Missing courseId or studentId" },
        { status: 400 }
      );
    }

    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 404 });
    }

    // Fetch lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId);

    if (lessonsError) {
      return NextResponse.json(
        { error: lessonsError.message },
        { status: 400 }
      );
    }

    // Fetch enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("*")
      .eq("course_id", courseId)
      .eq("student_id", studentId)
      .single();

    // It's okay if enrollment is null (not enrolled)
    return NextResponse.json({
      course,
      lessons,
      enrollment: enrollment || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
