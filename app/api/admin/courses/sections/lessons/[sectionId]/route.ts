import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET: List lessons for a section
export async function GET(req: NextRequest, context: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await context.params;
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: Create a lesson in a section
export async function POST(req: NextRequest, context: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await context.params;
  const { course_id, title } = await req.json();

  // Validate section exists and belongs to course_id
  const { data: section, error: sectionError } = await supabase
    .from('course_sections')
    .select('id, course_id')
    .eq('id', sectionId)
    .single();
  if (sectionError) {
    return NextResponse.json({ error: 'Section not found' }, { status: 400 });
  }
  if (section.course_id !== course_id) {
    return NextResponse.json({ error: 'Section does not belong to the specified course' }, { status: 400 });
  }

  // Find max order_index in this section
  const { data: maxOrder } = await supabase
    .from('lessons')
    .select('order_index')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();
  const order_index = maxOrder ? (maxOrder.order_index || 0) + 1 : 1;
  const { data, error } = await supabase
    .from('lessons')
    .insert([{ course_id, section_id: sectionId, title, order_index }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: Update lesson or move lesson to another section
export async function PATCH(req: NextRequest, context: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await context.params;
  const { lessonId, title, moveToSectionId } = await req.json();
  if (moveToSectionId) {
    // Move lesson to another section
    // Find max order_index in target section
    const { data: maxOrder } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('section_id', moveToSectionId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();
    const newOrder = maxOrder ? (maxOrder.order_index || 0) + 1 : 1;
    const { error } = await supabase
      .from('lessons')
      .update({ section_id: moveToSectionId, order_index: newOrder })
      .eq('id', lessonId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } else if (title) {
    // Edit lesson title
    const { data, error } = await supabase
      .from('lessons')
      .update({ title })
      .eq('id', lessonId)
      .eq('section_id', sectionId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

// DELETE: Delete a lesson from a section
export async function DELETE(req: NextRequest, context: { params: Promise<{ sectionId: string }> }) {
  try {
    const { sectionId } = await context.params;
    let lessonId: string | undefined = undefined;

    // Try to parse JSON body, but fallback to sectionId as lessonId if body is empty
    try {
      const body = await req.json();
      lessonId = body.lessonId;
    } catch {
      // No body, treat sectionId as lessonId (for DELETE /lessons/[lessonId])
      lessonId = sectionId;
    }

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error in DELETE lesson:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
