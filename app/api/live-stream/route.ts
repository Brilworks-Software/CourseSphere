import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id query param." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const projection = `
      id,
      course_id,
      instructor_id,
      title,
      description,
      youtube_video_id,
      youtube_video_url,
      scheduled_start_at,
      scheduled_end_at,
      status,
      is_recording_available,
      created_at,
      updated_at,
      instructor:users (id, first_name, last_name, profile_picture_url)
    `;

    const { data: stream, error } = await supabase
      .from("course_live_streams")
      .select(projection)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!stream) {
      return NextResponse.json(
        { error: "Live stream not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(stream);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
