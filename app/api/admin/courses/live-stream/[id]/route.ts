import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("course_live_streams")
      .select(`
        id,
        course_id,
        title,
        description,
        youtube_video_id,
        youtube_video_url,
        scheduled_start_at,
        scheduled_end_at,
        status,
        is_recording_available,
        announcement:course_announcements (
          id,
          title,
          is_published,
          created_at
        ),
        discussion_thread:course_discussion_threads (
          id,
          is_locked,
          thread_type,
          created_at
        ),
        instructor:users (
          id,
          first_name,
          last_name,
          email,
          profile_picture_url
        ),
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // normalize single-element relation arrays
    const thread = Array.isArray(data.discussion_thread) ? data.discussion_thread[0] : data.discussion_thread;
    const announcement = Array.isArray(data.announcement) ? data.announcement[0] : data.announcement;
    const normalized = {
      ...data,
      discussion_thread: thread ?? null,
      announcement: announcement ?? null,
    };

    return NextResponse.json(normalized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    // build update payload with only provided fields
    const {
      title,
      description,
      youtube_video_id,
      youtube_video_url,
      scheduled_start_at,
      scheduled_end_at,
      status,
      announcement_id,
      discussion_thread_id,
      is_recording_available,
      recording_lesson_id,
    } = body;

    if (
      title === undefined &&
      description === undefined &&
      youtube_video_id === undefined &&
      youtube_video_url === undefined &&
      scheduled_start_at === undefined &&
      scheduled_end_at === undefined &&
      status === undefined &&
      announcement_id === undefined &&
      discussion_thread_id === undefined &&
      is_recording_available === undefined &&
      recording_lesson_id === undefined
    ) {
      return NextResponse.json({ error: "No updatable fields provided." }, { status: 400 });
    }

    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (youtube_video_id !== undefined) updatePayload.youtube_video_id = youtube_video_id;
    if (youtube_video_url !== undefined) updatePayload.youtube_video_url = youtube_video_url;
    if (scheduled_start_at !== undefined) updatePayload.scheduled_start_at = scheduled_start_at;
    if (scheduled_end_at !== undefined) updatePayload.scheduled_end_at = scheduled_end_at;
    if (status !== undefined) updatePayload.status = status;
    if (announcement_id !== undefined) updatePayload.announcement_id = announcement_id;
    if (discussion_thread_id !== undefined) updatePayload.discussion_thread_id = discussion_thread_id;
    if (is_recording_available !== undefined) updatePayload.is_recording_available = is_recording_available;
    if (recording_lesson_id !== undefined) updatePayload.recording_lesson_id = recording_lesson_id;

    const { data, error } = await supabase
      .from("course_live_streams")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("course_live_streams")
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, deleted: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
