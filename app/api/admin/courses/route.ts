import { createClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!courseId || !userId || role !== "admin") {
      return Response.json({ error: "Missing courseId, userId, or invalid role" }, { status: 400 });
    }

    // Fetch course with organization and instructor details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(
        `*,
        organization:organization_id (
          id, name, slug, logo_url, thumbnail_url
        ),
        instructor:instructor_id (
          id, first_name,last_name, email, profile_picture_url
        )`
      )
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return Response.json({ error: courseError?.message || "Course not found" }, { status: 404 });
    }

    // Check admin access: only the instructor can access
    if (course.instructor_id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch sections for the course
    const { data: sections, error: sectionsError } = await supabase
      .from("course_sections")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (sectionsError) {
      return Response.json({ error: sectionsError.message }, { status: 400 });
    }

    // Fetch all lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId);

    if (lessonsError) {
      return Response.json({ error: lessonsError.message }, { status: 400 });
    }

    // Attach lessons to their respective sections
    const sectionsWithLessons = (sections || []).map((section) => ({
      ...section,
      lessons: (lessons || []).filter(
        (lesson) => lesson.section_id === section.id
      ),
    }));

    // Compose response (instructor data is now included as course.instructor)
    return Response.json({
      ...course,
      sections: sectionsWithLessons,
      lessons: lessons || [],
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { lessonId } = await req.json();
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", lessonId);
}
