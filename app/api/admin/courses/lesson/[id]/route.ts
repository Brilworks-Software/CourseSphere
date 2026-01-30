import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    // Only allow updating video_url and duration
    const updateData: any = {};
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.duration !== undefined) updateData.duration = body.duration;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("lessons")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("id, title, video_url, duration")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
