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

    if (!userId) {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const id = params.id || body.id;

    console.log("PATCH /api/courses/:id called");
    console.log("params.id:", params.id);
    console.log("body.id:", body.id);
    console.log("PATCH body:", body);

    if (!id) {
      console.log("No course id provided");
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

    console.log("PATCH updateFields:", updateFields);

    const { data, error } = await supabase
      .from("courses")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("PATCH success, data:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.log("PATCH exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
