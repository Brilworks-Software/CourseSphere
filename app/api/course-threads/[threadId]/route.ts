import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Get details of a thread (with replies)
export async function GET(req: NextRequest, context: { params: { threadId: string } }) {
  const { threadId } = context.params;
  if (!threadId) {
    return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
  }
  const supabase = createClient();
  // Get thread
  const { data: thread, error: threadError } = await supabase
    .from('course_discussion_threads')
    .select('*')
    .eq('id', threadId)
    .single();
  if (threadError || !thread) {
    return NextResponse.json({ error: threadError?.message || 'Thread not found' }, { status: 404 });
  }
  // Get replies
  const { data: replies, error: replyError } = await supabase
    .from('course_discussion_replies')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (replyError) {
    return NextResponse.json({ error: replyError.message }, { status: 500 });
  }
  return NextResponse.json({ thread, replies });
}

// Delete a thread
export async function DELETE(req: NextRequest, context: { params: { threadId: string } }) {
  const { threadId } = context.params;
  if (!threadId) {
    return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
  }
  const supabase = createClient();
  // Delete replies first (cascade)
  await supabase.from('course_discussion_replies').delete().eq('thread_id', threadId);
  // Delete thread
  const { error } = await supabase.from('course_discussion_threads').delete().eq('id', threadId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
