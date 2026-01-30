import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const body = await request.json();

    // Build updateFields from all possible fields in the body, matching DB schema
    const updateFields: any = {
      title: body.title,
      subtitle: body.subtitle ?? null,
      description: body.description ?? null,
      language: body.language ?? null,
      level: body.level ?? null,
      is_active: body.is_active,
      thumbnail_url: body.thumbnail_url ?? null,
      primary_category: body.primary_category ?? null,
      sub_category: body.sub_category ?? null,
      status: body.status ?? null,
      last_submitted_at: body.last_submitted_at ?? null,
      published_at: body.published_at ?? null,
      is_free: body.is_free,
      price: body.price,
      razorpay_connected: body.razorpay_connected ?? false,
      razorpay_key: body.razorpay_key ?? null,
      organization_id: body.organization_id ?? null,
      instructor_id: body.instructor_id ?? null,
      requirements: body.requirements ?? null,
      expectations: body.expectations ?? null,              
    };

    console.log("PATCH updateFields:", updateFields);

    const { error: updateError } = await supabase
      .from("courses")
      .update(updateFields)
      .eq("id", id);

    if (updateError) {
      console.log("PATCH error:", updateError);
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

    console.log("PATCH success, data:", updatedCourse);
    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    console.log("PATCH exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch course with organization details and lessons count
    const { data: course, error } = await supabase
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
