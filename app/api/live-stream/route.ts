import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   try {
//     const url = new URL(request.url);
//     const id = url.searchParams.get("id");
//     if (!id) {
//       return NextResponse.json(
//         { error: "Missing id query param." },
//         { status: 400 },
//       );
//     }

//     const supabase = await createClient();

//     const projection = `
//       id,
//       course_id,
//       instructor_id,
//       title,
//       description,
//       youtube_video_id,
//       youtube_video_url,
//       scheduled_start_at,
//       scheduled_end_at,
//       status,
//       is_recording_available,
//       created_at,
//       updated_at,
//       instructor:users (id, first_name, last_name, profile_picture_url)
//     `;

//     const { data: stream, error } = await supabase
//       .from("course_live_streams")
//       .select(projection)
//       .eq("id", id)
//       .single();

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }

//     if (!stream) {
//       return NextResponse.json(
//         { error: "Live stream not found." },
//         { status: 404 },
//       );
//     }

//     return NextResponse.json(stream);
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: err?.message ?? String(err) },
//       { status: 500 },
//     );
//   }
// }
export async function GET(request: Request) {
  // Replace the previous GET implementation with a robust, well-typed flow:
  try {
    const supabase = await createClient();
    const url = new URL(request.url);

    // Read query params first
    let course_id = url.searchParams.get("course_id");
    let stream_id = url.searchParams.get("stream_id");
    let student_id = url.searchParams.get("student_id");
    let only_live = url.searchParams.get("only_live");

    // If none present in query, fall back to JSON body for backward compatibility
    if (!course_id && !stream_id && !student_id && !only_live) {
      try {
        const body = await request.json();
        if (body) {
          course_id = course_id ?? body.course_id;
          stream_id = stream_id ?? body.stream_id;
          student_id = student_id ?? body.student_id;
          only_live =
            only_live ?? (body.only_live === true ? "true" : body.only_live);
        }
      } catch (e) {
        // ignore parse errors, we'll validate below
      }
    }

    // Convert only_live to boolean
    const onlyLiveFlag = String(only_live ?? "").toLowerCase() === "true";

    // Require at least one selector
    if (!stream_id && !course_id && !student_id) {
      return NextResponse.json(
        {
          error: "Missing course_id, stream_id or student_id query/body param.",
        },
        { status: 400 },
      );
    }

    // projection for select
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
      // streams for a single course
      let query: any = supabase
        .from("course_live_streams")
        .select(projection)
        .eq("course_id", course_id)
        .order("scheduled_start_at", { ascending: false });
      if (onlyLiveFlag) {
        query = query.eq("status", "live");
      }
      streamsResult = await query;
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

      // if student not enrolled anywhere, return empty array
      if (courseIds.length === 0) {
        return NextResponse.json([]);
      }

      let query: any = supabase
        .from("course_live_streams")
        .select(projection)
        .in("course_id", courseIds)
        .order("scheduled_start_at", { ascending: false });

      // if (onlyLiveFlag) {
      //   query = query.eq("status", "live");
      // }

      streamsResult = await query;
    } else {
      // Shouldn't reach here due to earlier validation, but keep defensive
      return NextResponse.json(
        { error: "Missing course_id or student_id query param." },
        { status: 400 },
      );
    }

    const { data: streams, error } = streamsResult;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Normalize nested single-array relations to single objects (or null)
    const normalized = (streams || []).map((s: any) => {
      const thread = Array.isArray(s.discussion_thread)
        ? s.discussion_thread[0]
        : s.discussion_thread;
      const announcement = Array.isArray(s.announcement)
        ? s.announcement[0]
        : s.announcement;
      // return as-is but ensure announcement/thread are single objects or null
      return {
        ...s,
        discussion_thread: thread ?? null,
        announcement: announcement ?? null,
      };
    });

    return NextResponse.json(normalized);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}
