import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Use instructor_id from the request body
    // Handle is_free and price logic
    const isFree = body.is_free === undefined ? true : body.is_free;
    let price = 0;
    if (!isFree && body.price !== undefined) {
      price = body.price;
    }
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: body.title,
        description: body.description || null,
        instructor_id: body.instructor_id, // corrected line
        is_active: body.is_active === undefined ? true : body.is_active,
        organization_id: body.organization_id || null,
        thumbnail_url: body.thumbnail_url || null,
        primary_category: body.primary_category || null,
        sub_category: body.sub_category || null,
        is_free: isFree,
        price,
      })
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

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If no userId provided, return all published courses for affiliate URL generation
    if (!userId) {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          id,
          title,
          price,
          thumbnail_url,
          instructor_id,
          is_free,
          status
        `,
        )
        .eq("status", "published")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data);
    }

    // Original logic for when userId is provided
    const { data, error } = await supabase.from("courses").select("*");
    // .eq("student_id", userId); // Uncomment if you want to filter by instructor
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const id = params.id || body.id;

    if (!id) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }

    // Map all fields to DB columns, using null for missing/empty values
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
    };

    const { data, error } = await supabase
      .from("courses")
      .update(updateFields)
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
