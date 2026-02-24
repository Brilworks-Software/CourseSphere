import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

// GET /api/student/certificates?studentId=&courseId=
// Returns the certificate for a student+course, or null
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
      .from("course_certificates")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ certificate: data || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/student/certificates
// Body: { studentId, courseId }
// Issues a certificate if:
//   - student is 100% done with the course
//   - no certificate exists yet (idempotent — returns existing if found)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { studentId, courseId } = body;

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: "Missing studentId or courseId" },
        { status: 400 },
      );
    }

    // 1. Check if certificate already exists (idempotent)
    const { data: existing } = await supabase
      .from("course_certificates")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ certificate: existing, alreadyIssued: true });
    }

    // 2. Verify all lessons are completed
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id, duration")
      .eq("course_id", courseId);

    const totalLessons = allLessons?.length || 0;

    const { count: completedCount } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .eq("is_completed", true);

    if (totalLessons === 0 || (completedCount || 0) < totalLessons) {
      return NextResponse.json(
        {
          error: "Course not yet completed",
          completedCount: completedCount || 0,
          totalLessons,
        },
        { status: 400 },
      );
    }

    // 3. Fetch snapshot data (student, course, instructor, organization)
    const { data: student } = await supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", studentId)
      .single();

    const { data: course } = await supabase
      .from("courses")
      .select(
        "title, instructor_id, organization_id, organization:organization_id(name)",
      )
      .eq("id", courseId)
      .single();

    let instructorName: string | null = null;
    if (course?.instructor_id) {
      const { data: instructor } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", course.instructor_id)
        .single();
      if (instructor) {
        instructorName =
          [instructor.first_name, instructor.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || null;
      }
    }

    const totalSeconds = (allLessons || []).reduce(
      (sum, l) => sum + (l.duration || 0),
      0,
    );
    const totalHours = parseFloat((totalSeconds / 3600).toFixed(2));

    // 4. Generate certificate number via the Postgres function
    const { data: certNumResult } = await supabase.rpc(
      "generate_certificate_number",
    );
    const certificateNumber =
      certNumResult ||
      `CERT-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;

    const studentName =
      [student?.first_name, student?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      student?.email ||
      "Student";

    const orgName = (course?.organization as any)?.name || null;

    // 5. Insert certificate
    const { data: cert, error: certError } = await supabase
      .from("course_certificates")
      .insert({
        certificate_number: certificateNumber,
        student_id: studentId,
        course_id: courseId,
        student_name: studentName,
        course_name: course?.title || "Course",
        instructor_name: instructorName,
        organization_name: orgName,
        total_lessons: totalLessons,
        total_hours: totalHours,
      })
      .select()
      .single();

    if (certError) {
      return NextResponse.json({ error: certError.message }, { status: 500 });
    }

    return NextResponse.json({ certificate: cert, alreadyIssued: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
