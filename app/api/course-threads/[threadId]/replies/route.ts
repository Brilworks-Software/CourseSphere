import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Add a reply to a thread, or list replies
export async function GET(req: NextRequest, context: { params: { threadId: string } }) {
  const { threadId } = context.params;
  if (!threadId) {
    return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('course_discussion_replies')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ replies: data || [] });
}

export async function POST(req: NextRequest, context: { params: { threadId: string } }) {
  const { threadId } = context.params;
  const body = await req.json();
  const { user_id, body: replyBody, parent_reply_id, is_instructor_reply } = body;
  if (!threadId || !user_id || !replyBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('course_discussion_replies')
    .insert({
      thread_id: threadId,
      user_id,
      body: replyBody,
      parent_reply_id,
      is_instructor_reply: !!is_instructor_reply,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reply: data }, { status: 201 });
}

// Delete a reply
export async function DELETE(req: NextRequest, context: { params: { threadId: string } }) {
  const { searchParams } = new URL(req.url);
  const replyId = searchParams.get('replyId');
  if (!replyId) {
    return NextResponse.json({ error: 'Missing replyId' }, { status: 400 });
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('course_discussion_replies')
    .delete()
    .eq('id', replyId)
    .eq('thread_id', context.params.threadId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
