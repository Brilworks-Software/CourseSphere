import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// List all threads for a course, or create a new thread
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('course_discussion_threads')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ threads: data || [] });
}

// Create a new thread
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { course_id, user_id, title, body: threadBody, thread_type, lesson_id } = body;
  if (!course_id || !user_id || !title || !threadBody || !thread_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('course_discussion_threads')
    .insert({
      course_id,
      user_id,
      title,
      body: threadBody,
      thread_type,
      lesson_id,
      allow_comments: true,
      is_locked: false,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ thread: data }, { status: 201 });
}
