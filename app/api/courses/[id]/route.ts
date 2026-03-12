import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const body = await request.json();

    // Only update fields that are present in the request body
    const allowedFields = [
      "title",
      "subtitle",
      "description",
      "language",
      "level",
      "is_active",
      "thumbnail_url",
      "primary_category",
      "sub_category",
      "status",
      "last_submitted_at",
      "published_at",
      "is_free",
      "price",
      "razorpay_connected",
      "razorpay_key",
      "organization_id",
      "instructor_id",
      "requirements",
      "expectations",
    ];
    const updateFields: any = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateFields[key] = body[key];
      }
    }

    const { error: updateError } = await supabase
      .from("courses")
      .update(updateFields)
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
      `,
      )
      .eq("id", id)
      .single();

    if (refetchError) {
      return NextResponse.json(
        { error: refetchError.message },
        { status: 400 },
      );
    }

    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
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
      `,
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
