import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user has access
    const { data: course } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();

    // Normalize thumbnail: treat empty string as null, allow explicit null
    const thumbnail =
      body.thumbnail_url === ""
        ? null
        : body.thumbnail_url !== undefined
        ? body.thumbnail_url
        : course.thumbnail_url ?? null;

    // Normalize primary_category and sub_category, accept older "category" as fallback
    const primary_category =
      body.primary_category === ""
        ? null
        : body.primary_category !== undefined
        ? body.primary_category
        : body.category !== undefined
        ? body.category
        : course.primary_category ?? null;

    const sub_category =
      body.sub_category === ""
        ? null
        : body.sub_category !== undefined
        ? body.sub_category
        : course.sub_category ?? null;

    const { data, error } = await supabase
      .from("courses")
      .update({
        title: body.title,
        description: body.description || null,
        is_active:
          body.is_active !== undefined ? body.is_active : course.is_active,
        // update thumbnail_url when provided (null clears it)
        thumbnail_url: thumbnail,
        // update categories
        primary_category,
        sub_category,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
