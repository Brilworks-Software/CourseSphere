import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

// Create announcement (POST)
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: course_id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();
    const instructor_id = body.instructor_id;
    const { title, message, is_published, is_pinned, send_email } = body;

    if (!title || !message || !instructor_id) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { data, error } = await supabase.from("course_announcements").insert([
      {
        course_id,
        instructor_id,
        title,
        message,
        is_published: is_published ?? true,
        is_pinned: is_pinned ?? false,
        send_email: send_email ?? false,
      },
    ]).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get all announcements for a course (GET)
// export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
//   try {
//     const { id: course_id } = await context.params;
//     const supabase = await createClient();
//     const { data, error } = await supabase
//       .from("course_announcements")
//       .select("*")
//       .eq("course_id", course_id)
//       .order("created_at", { ascending: false });
//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }
//     return NextResponse.json(data);
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

/**
 * GET ALL ANNOUNCEMENTS WITH THREAD INFO (ADMIN)
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: course_id } = await context.params;
    const supabase = await createClient();

    // 1. Get all announcements with their threads and instructor info
    const { data: announcements, error: annError } = await supabase
      .from("course_announcements")
      .select(`
        id,
        title,
        message,
        is_published,
        is_pinned,
        created_at,
        instructor:users (
          id,
          first_name,
          last_name,
          email,
          profile_picture_url
        ),
        discussion_thread:course_discussion_threads (
          id,
          is_locked,
          created_at
        )
      `)
      .eq("course_id", course_id)
      .order("created_at", { ascending: false });

    if (annError) {
      return NextResponse.json({ error: annError.message }, { status: 400 });
    }

    // 2. For each announcement, fetch replies for its thread (if exists)
    const result = [];
    for (const ann of announcements) {
      let threadReplies: any[] = [];
      let participantsMap = new Map();

      // Fix: discussion_thread is an array, use first element if exists
      const thread = Array.isArray(ann.discussion_thread) ? ann.discussion_thread[0] : ann.discussion_thread;

      if (thread?.id) {
        // Fetch replies with user info for this thread
        const { data: replies, error: repError } = await supabase
          .from("course_discussion_replies")
          .select(`
            id,
            body,
            created_at,
            is_instructor_reply,
            parent_reply_id,
            user:users (
              id,
              first_name,
              last_name,
              profile_picture_url
            )
          `)
          .eq("thread_id", thread.id)
          .order("created_at", { ascending: true });

        if (repError) {
          return NextResponse.json({ error: repError.message }, { status: 400 });
        }

        // Collect unique participants
        for (const reply of replies) {
          if (Array.isArray(reply.user) && reply.user[0]) {
            participantsMap.set(reply.user[0].id, reply.user[0]);
          }
        }

        // Optionally, nest replies by parent_reply_id if you want threaded replies
        threadReplies = replies;
      }

      result.push({
        ...ann,
        thread_id: thread?.id || null,
        is_thread_locked: thread?.is_locked ?? false,
        replies: threadReplies as any[],
        participants: Array.from(participantsMap.values()) as any[],
        participant_count: participantsMap.size,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update announcement (PUT)
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: course_id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();
    const { title, message, is_published, is_pinned } = body;
    const url = new URL(request.url);
    const announcement_id = url.searchParams.get("announcement_id");

    if (!announcement_id || !title || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("course_announcements")
      .update({
        title,
        message,
        is_published: is_published ?? true,
        is_pinned: is_pinned ?? false,
      })
      .eq("id", announcement_id)
      .eq("course_id", course_id)
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

// Update or delete can be added similarly if needed
