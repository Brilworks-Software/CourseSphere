import { createClient } from "@/lib/supabase/client";

export async function POST(req: Request) {
  const { courseId, userId } = await req.json();
  const supabase = await createClient();

  await supabase.from("enrollments").insert({
    student_id: userId,
    course_id: courseId,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
