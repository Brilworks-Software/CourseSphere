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
        { status: 400 },
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
      `,
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
        { status: 400 },
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
        { status: 400 },
      );
    }

    // Calculate analytics fields
    const lecture_count = (lessons || []).length;
    const total_video_time = (lessons || []).reduce(
      (sum, lesson) => sum + (lesson.duration || 0),
      0,
    );

    // Construct video_url for each lesson if aws_asset_key exists
    const AWS_REGION = process.env.AWS_REGION;
    const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
    const AWS_PROCESSED_FOLDER_VIDEO =
      process.env.AWS_PROCESSED_FOLDER_VIDEO || "processed";

    // Ensure lessons are sorted by order_index (if exists)
    const lessonsSorted = (lessons || []).sort((a, b) => {
      if (a.order_index !== undefined && b.order_index !== undefined) {
        return a.order_index - b.order_index;
      }
      return 0;
    });

    const lessonsWithVideoUrl = lessonsSorted.map((lesson) => {
      // Only construct video_url if aws_asset_key exists and lesson is a video
      if (lesson.aws_asset_key) {
        return {
          ...lesson,
          video_url: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${AWS_PROCESSED_FOLDER_VIDEO}/${lesson.aws_asset_key}`,
        };
      }
      return lesson;
    });

    // Attach lessons to their respective sections, ensuring correct order
    const sectionsWithLessons = (sections || []).map((section) => {
      // Filter lessons for this section and sort by order_index
      const sectionLessons = (lessonsWithVideoUrl || [])
        .filter((lesson) => lesson.section_id === section.id)
        .sort((a, b) => {
          if (a.order_index !== undefined && b.order_index !== undefined) {
            return a.order_index - b.order_index;
          }
          return 0;
        });
      return {
        ...section,
        lessons: sectionLessons,
      };
    });

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
              "id, email, first_name, last_name, profile_picture_url, role, bio, organization_id",
            )
            .eq("id", course.instructor_id)
            .single();

        if (!instructorUser || instructorUserError) {
          // Keep instructor as null if user row not found or any error occurred
          instructor = null;
        } else {
          // Fetch profile safely — select returns an array if not using .single()
          const { data: instructorProfiles, error: instructorProfileError } =
            await supabase
              .from("profiles")
              .select("avatar_url, institute_name, website")
              .eq("id", course.instructor_id);

          const instructorProfile = Array.isArray(instructorProfiles)
            ? instructorProfiles[0] || null
            : instructorProfiles || null;

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
      lecture_count,
      total_video_time,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
