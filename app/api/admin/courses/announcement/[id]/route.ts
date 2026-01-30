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
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: course_id } = await context.params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_announcements")
      .select("*")
      .eq("course_id", course_id)
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
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
