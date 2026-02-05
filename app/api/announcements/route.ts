import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client"; // Ensure createClient is exported from this module

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("course_announcements")
    .select("*, instructor:instructor_id(id, first_name,last_name, profile_picture_url)")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ announcements: data || [] });
}
