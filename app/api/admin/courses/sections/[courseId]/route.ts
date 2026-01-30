import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await context.params;
  // Optionally, check if courseId is actually a sectionId (for debugging)
  // If you want to enforce only course IDs, you can do:
  // const { data: section } = await supabase.from("course_sections").select("id").eq("id", courseId).single();
  // if (section) return NextResponse.json({ error: "Section ID passed instead of course ID" }, { status: 400 });

  // Check if course exists
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .single();
  if (courseError) {
    return NextResponse.json({ error: "Course not found" }, { status: 400 });
  }
  // Fetch all sections for the course, ordered by order_index
  const { data: sections, error } = await supabase
    .from("course_sections")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If no section exists, create default "Introduction"
  if (!sections || sections.length === 0) {
    const { data: introSection, error: introErr } = await supabase
      .from("course_sections")
      .insert([{ course_id: courseId, title: "Introduction", order_index: 1 }])
      .select()
      .single();
    if (introErr) return NextResponse.json({ error: introErr.message }, { status: 500 });
    // Fetch lessons for the new section (should be empty)
    return NextResponse.json([{ ...introSection, lessons: [] }]);
  }

  // Fetch all lessons for these sections
  const sectionIds = sections.map(s => s.id);
  let lessons: any[] = [];
  if (sectionIds.length > 0) {
    const { data: lessonsData, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .in("section_id", sectionIds);
    if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 });
    lessons = lessonsData || [];
  }

  // Attach lessons to their respective sections
  const sectionsWithLessons = sections.map(section => ({
    ...section,
    lessons: lessons.filter(lesson => lesson.section_id === section.id).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
  }));

  return NextResponse.json(sectionsWithLessons);
}

export async function POST(req: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await context.params;
  const { title, description } = await req.json();
  // Check if course exists
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .single();
  if (courseError) {
    return NextResponse.json({ error: "Course not found" }, { status: 400 });
  }
  // Find max order_index
  const { data: maxOrder } = await supabase
    .from("course_sections")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();
  const order_index = maxOrder ? (maxOrder.order_index || 0) + 1 : 1;
  const { data, error } = await supabase
    .from("course_sections")
    .insert([{ course_id: courseId, title, description, order_index }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await context.params;
  const { sectionId, title } = await req.json();

  // Check if section exists
  const { data: section, error: sectionError } = await supabase
    .from("course_sections")
    .select("id")
    .eq("id", sectionId)
    .single();
  if (sectionError) {
    return NextResponse.json({ error: "Section not found" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("course_sections")
    .update({ title })
    .eq("id", sectionId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await context.params;
  const { sectionId } = await req.json();

  // Check if section exists
  const { data: section, error: sectionError } = await supabase
    .from("course_sections")
    .select("id")
    .eq("id", sectionId)
    .single();
  if (sectionError) {
    return NextResponse.json({ error: "Section not found" }, { status: 400 });
  }

  // Delete all lessons under this section
  await supabase.from("lessons").delete().eq("section_id", sectionId);
  // Delete the section
  const { error } = await supabase
    .from("course_sections")
    .delete()
    .eq("id", sectionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
