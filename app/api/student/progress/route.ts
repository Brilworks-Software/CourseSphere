import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

// GET /api/student/progress?studentId=&courseId=
// Returns all lesson_progress rows for a student in a course
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const courseId = searchParams.get("courseId");

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: "Missing studentId or courseId" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/student/progress
// Body: { studentId, courseId, lessonId, sectionId?, action: 'open' | 'complete' }
// Upserts a lesson_progress row. Uses (student_id, lesson_id) as the unique key.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { studentId, courseId, lessonId, sectionId, action } = body;

    if (!studentId || !courseId || !lessonId || !action) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: studentId, courseId, lessonId, action",
        },
        { status: 400 },
      );
    }

    if (!["open", "complete"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'open' or 'complete'" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    if (action === "open") {
      // Insert a new progress row if one doesn't exist yet (don't overwrite completion)
      const { data: existing } = await supabase
        .from("lesson_progress")
        .select("id, is_completed")
        .eq("student_id", studentId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (!existing) {
        const { data, error } = await supabase
          .from("lesson_progress")
          .insert({
            student_id: studentId,
            course_id: courseId,
            lesson_id: lessonId,
            section_id: sectionId || null,
            is_completed: false,
            opened_at: now,
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ progress: data });
      }

      // Already exists — return as-is
      return NextResponse.json({ progress: existing });
    }

    // action === 'complete'
    const { data, error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          section_id: sectionId || null,
          is_completed: true,
          completed_at: now,
        },
        { onConflict: "student_id,lesson_id" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if all lessons in the course are now completed
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId);

    const totalLessons = allLessons?.length || 0;

    const { count: completedCount } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .eq("is_completed", true);

    const isCourseCompleted =
      totalLessons > 0 && (completedCount || 0) >= totalLessons;

    return NextResponse.json({
      progress: data,
      isCourseCompleted,
      completedCount: completedCount || 0,
      totalLessons,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
