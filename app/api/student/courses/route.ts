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

    // Fetch course with organization details and lessons count
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(
        `*,
        organization:organization_id (
          id, name, slug, logo_url, thumbnail_url
        ),
        lessons:lessons(count)
      `
      )
      .eq("id", courseId)
      .single();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 404 });
    }

    // Fetch sections for the course
    const { data: sections, error: sectionsError } = await supabase
      .from("course_sections")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (sectionsError) {
      return NextResponse.json(
        { error: sectionsError.message },
        { status: 400 }
      );
    }

    // Fetch all lessons for the course
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

    // Attach lessons to their respective sections
    const sectionsWithLessons = (sections || []).map((section) => ({
      ...section,
      lessons: (lessons || []).filter(
        (lesson) => lesson.section_id === section.id
      ),
    }));

    // Fetch enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("course_id", courseId)
      .eq("student_id", studentId)
      .single();

    // Fetch instructor details (user + optional profile) and attach to response
    let instructor = null;
    try {
      if (course?.instructor_id) {
        const { data: instructorUser, error: instructorUserError } =
          await supabase
            .from("users")
            .select(
              "id, name, email, first_name, last_name, profile_picture_url, role, bio, organization_id"
            )
            .eq("id", course.instructor_id)
            .single();

        const { data: instructorProfile } = await supabase
          .from("profiles")
          .select("avatar_url, institute_name, website")
          .eq("id", course.instructor_id)
          .single();

        if (!instructorUserError && instructorUser) {
          instructor = {
            ...instructorUser,
            profile: instructorProfile || null,
          };
        }
      }
    } catch {
      // Ignore instructor lookup errors; keep instructor as null
      instructor = null;
    }

    // Compose response: course with organization, sections (with lessons), lessons count, enrollment, instructor
    return NextResponse.json({
      ...course,
      sections: sectionsWithLessons,
      enrollment: enrollment || null,
      instructor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
