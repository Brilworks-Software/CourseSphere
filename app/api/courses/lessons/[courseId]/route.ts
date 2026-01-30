import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

// Helper to get courseId from params
function getCourseIdFromParams(params: any) {
  return params?.courseId;
}

// GET: List all lessons for a course (optionally by section)
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const courseId = getCourseIdFromParams(params);
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data });
}

// POST: Create a new lesson under a section for a course
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const courseId = getCourseIdFromParams(params);
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  const body = await req.json();
  const { section_id, title, video_url, duration } = body;
  if (!section_id || !title) {
    return NextResponse.json({ error: 'section_id and title are required' }, { status: 400 });
  }
  // Insert lesson
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      section_id,
      title,
      video_url: video_url || '',
      duration: duration || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

// PATCH: Update lesson (title, move section, etc)
export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  const courseId = getCourseIdFromParams(params);
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  const body = await req.json();
  const { lessonId, title, section_id } = body;
  if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
  const update: any = {};
  if (title) update.title = title;
  if (section_id) update.section_id = section_id;
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('lessons')
    .update(update)
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

// DELETE: Delete a lesson
export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  const courseId = getCourseIdFromParams(params);
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  const body = await req.json();
  const { lessonId } = body;
  if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('course_id', courseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
