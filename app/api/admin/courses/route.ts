import { createClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const userId = searchParams.get("userId");

    let query = supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (role === "admin" && userId) {
      query = query.eq("instructor_id", userId);
    }

    const { data: courses, error } = await query;
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ courses });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { lessonId } = await req.json();
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", lessonId);
}
