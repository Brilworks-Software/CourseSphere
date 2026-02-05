// // API route for GET/POST comments on an announcement
// import { NextRequest, NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabaseClient';

// export async function GET(req: NextRequest, context: { params: Promise<{ announcementId: string }> }) {
//   const { announcementId } = await context.params;
//   // Fetch comments for the announcement
//   const { data, error } = await supabase
//     .from('course_discussion_replies')
//     .select('*')
//     .eq('thread_id', announcementId)
//     .order('created_at', { ascending: false });
//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
//   return NextResponse.json({ comments: data });
// }

// export async function POST(req: NextRequest, context: { params: Promise<{ announcementId: string }> }) {
//   const { announcementId } = await context.params;
//   const body = await req.json();
//   const { user_id, user_role } = body;
//   if (!user_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   if (!body.body || typeof body.body !== 'string') {
//     return NextResponse.json({ error: 'Invalid comment' }, { status: 400 });
//   }
//   // TODO: Check if comments are allowed and not locked (fetch thread/announcement)
//   const { data, error } = await supabase
//     .from('course_discussion_replies')
//     .insert({
//       thread_id: announcementId,
//       user_id: user_id,
//       body: body.body,
//       is_instructor_reply: user_role === 'instructor',
//     })
//     .select()
//     .single();
//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
//   return NextResponse.json({ comment: data });
// }
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

type RouteContext = {
  params: {
    announcementId: string;
  };
};

// Utility: Get or create a discussion thread for an announcement
async function getOrCreateAnnouncementThread(
  announcementId: string,
  userId: string,
  courseId: string
) {
  // 1️⃣ Try to fetch thread by announcement_id
  const { data: existingThread, error: fetchError } = await supabase
    .from('course_discussion_threads')
    .select('*')
    .eq('announcement_id', announcementId)
    .single();

  if (existingThread) return existingThread;

  // 2️⃣ Ensure the announcement exists (to satisfy FK constraint)
  const { data: announcement, error: annError } = await supabase
    .from('course_announcements')
    .select('id')
    .eq('id', announcementId)
    .single();

  if (annError || !announcement) {
    throw new Error('Announcement not found');
  }

  // 3️⃣ Create thread with announcement_id referencing the announcement
  const { data: newThread, error: insertError } = await supabase
    .from('course_discussion_threads')
    .insert({
      course_id: courseId,
      user_id: userId,
      title: 'Announcement',
      body: '',
      thread_type: 'announcement',
      announcement_id: announcementId,
      allow_comments: true,
      is_locked: false,
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);
  return newThread;
}

/**
 * GET comments for an announcement
 */
export async function GET(
  req: NextRequest,
  context: RouteContext | { params: Promise<{ announcementId: string }> }
) {
  // Await params if it's a Promise (for dynamic API routes)
  const params = 'then' in context.params ? await context.params : context.params;
  const { announcementId } = params;

  if (!announcementId) {
    return NextResponse.json(
      { error: 'announcementId is required' },
      { status: 400 }
    );
  }

  // Find the thread for this announcement
  const { data: thread, error: threadError } = await supabase
    .from('course_discussion_threads')
    .select('id')
    .eq('announcement_id', announcementId)
    .single();

  if (threadError || !thread) {
    // No thread/comments yet
    return NextResponse.json({ comments: [] });
  }

  // Fetch comments for the thread
  const { data, error } = await supabase
    .from('course_discussion_replies')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

/**
 * POST comment on announcement
 */
export async function POST(
  req: NextRequest,
  context: RouteContext | { params: Promise<{ announcementId: string }> }
) {
  // Await params if it's a Promise (for dynamic API routes)
  const params = 'then' in context.params ? await context.params : context.params;
  const { announcementId } = params;

  if (!announcementId) {
    return NextResponse.json(
      { error: 'announcementId is required' },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const { user_id, user_role, body, course_id } = payload;

  // Validate required fields from payload
  if (!course_id) {
    return NextResponse.json(
      { error: 'course_id is required in body' },
      { status: 400 }
    );
  }
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!body || typeof body !== 'string') {
    return NextResponse.json(
      { error: 'Invalid comment body' },
      { status: 400 }
    );
  }

  try {
    /**
     * ✅ Ensure thread exists (auto-create if first time)
     */
    const thread = await getOrCreateAnnouncementThread(
      announcementId,
      user_id,
      course_id
    );

    if (!thread.allow_comments || thread.is_locked) {
      return NextResponse.json(
        { error: 'Comments are disabled for this announcement' },
        { status: 403 }
      );
    }

    /**
     * ✅ Insert comment (thread_id must be the thread's id)
     */
    const { data, error } = await supabase
      .from('course_discussion_replies')
      .insert({
        thread_id: thread.id,
        user_id,
        body,
        is_instructor_reply: user_role === 'instructor',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
