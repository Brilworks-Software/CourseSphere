import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      course_id,
      instructor_id,
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

    if (!title || !instructor_id || !course_id) {
      return NextResponse.json(
        { error: "Missing required fields (course_id, title, instructor_id)." },
        { status: 400 },
      );
    }

    const payload: any = {
      course_id,
      instructor_id,
      title,
      description: description ?? null,
      youtube_video_id: youtube_video_id ?? null,
      youtube_video_url: youtube_video_url ?? null,
      scheduled_start_at: scheduled_start_at ?? null,
      scheduled_end_at: scheduled_end_at ?? null,
      status: status ?? "scheduled",
      announcement_id: announcement_id ?? null,
      discussion_thread_id: discussion_thread_id ?? null,
      is_recording_available: is_recording_available ?? false,
      recording_lesson_id: recording_lesson_id ?? null,
    };

    const { data, error } = await supabase
      .from("course_live_streams")
      .insert([payload])
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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    // Support either course_id OR student_id (via query param). If student_id is present
    // return streams for courses where the student is enrolled. Also support optional
    // `only_live=true` to filter to streams with status='live'.
    const course_id = url.searchParams.get("course_id");
    const student_id = url.searchParams.get("student_id");
    const stream_id = url.searchParams.get("stream_id");
    const only_live = url.searchParams.get("only_live") === "true";

    // If no course_id and no student_id provided, try reading body for backward-compatibility
    if (!course_id && !student_id) {
      try {
        const body = await request.json();
        if (body?.student_id) {
          // prefer body.student_id when provided
          // note: keep as string
        }
      } catch (e) {
        // ignore body parse errors
      }
    }

    // Helper to build the select projection
    const projection = `
        id,
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
        instructor:users (
          id,
          first_name,
          last_name,
          email,
          profile_picture_url
        ),
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
        )
      `;

    let streamsResult: any = { data: [], error: null };

    if (stream_id) {
      // fetch single stream by id
      streamsResult = await supabase
        .from("course_live_streams")
        .select(projection)
        .eq("id", stream_id)
        .limit(1)
        .single();
    } else if (course_id) {
      // existing flow: streams for a single course
      streamsResult = await supabase
        .from("course_live_streams")
        .select(projection)
        .eq("course_id", course_id)
        .order("scheduled_start_at", { ascending: false });
    } else if (student_id) {
      // find course_ids for enrollments
      const { data: enrollments, error: enrollErr } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", student_id);

      if (enrollErr) {
        return NextResponse.json({ error: enrollErr.message }, { status: 400 });
      }

      const courseIds = (enrollments || [])
        .map((r: any) => r.course_id)
        .filter(Boolean);

      if (courseIds.length === 0) {
        return NextResponse.json([]);
      }

      let query: any = supabase
        .from("course_live_streams")
        .select(projection)
        .in("course_id", courseIds)
        .order("scheduled_start_at", { ascending: false });
      if (only_live) {
        query = query.eq("status", "live");
      }

      streamsResult = await query;
    } else {
      return NextResponse.json(
        { error: "Missing course_id or student_id query param." },
        { status: 400 },
      );
    }
    const { data: streams, error } = streamsResult;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const normalized = (streams || []).map((s: any) => {
      const thread = Array.isArray(s.discussion_thread)
        ? s.discussion_thread[0]
        : s.discussion_thread;
      const announcement = Array.isArray(s.announcement)
        ? s.announcement[0]
        : s.announcement;
      return {
        ...s,
        discussion_thread: thread ?? null,
        announcement: announcement ?? null,
      };
    });

    return NextResponse.json(normalized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
