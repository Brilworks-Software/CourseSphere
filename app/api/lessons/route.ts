import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Verify course ownership
    const { data: course } = await supabase
      .from("courses")
      .select("*")
      .eq("id", body.course_id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        course_id: body.course_id,
        title: body.title,
        video_url: body.video_url,
        duration: body.duration || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
