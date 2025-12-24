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

    // Fetch course with organization details and lessons count
    const { data: course, error: fetchError } = await supabase
      .from("courses")
      .select(
        `*,
        organization:organization_id (
          id, name, slug, logo_url, thumbnail_url
        ),
        lessons:lessons(count)
      `
      )
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

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

    // Handle is_free and price logic
    const isFree = body.is_free === undefined ? course.is_free : body.is_free;
    let price = 0;
    if (!isFree && body.price !== undefined) {
      price = body.price;
    } else if (!isFree && course.price !== undefined) {
      price = course.price;
    }

    const { error: updateError } = await supabase
      .from("courses")
      .update({
        title: body.title,
        description: body.description || null,
        is_active:
          body.is_active === undefined ? course.is_active : body.is_active,
        // update thumbnail_url when provided (null clears it)
        thumbnail_url: thumbnail,
        // update categories
        primary_category,
        sub_category,
        is_free: isFree,
        price,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Refetch the updated course with organization and lessons count
    const { data: updatedCourse, error: refetchError } = await supabase
      .from("courses")
      .select(
        `*,
        organization:organization_id (
          id, name, slug, logo_url, thumbnail_url
        ),
        lessons:lessons(count)
      `
      )
      .eq("id", id)
      .single();

    if (refetchError) {
      return NextResponse.json(
        { error: refetchError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
