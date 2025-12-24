import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Use instructor_id from the request body
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: body.title,
        description: body.description || null,
        instructor_id: body.instructor_id, // corrected line
        is_active: body.is_active !== undefined ? body.is_active : true,
        organization_id: body.organization_id || null,
        thumbnail_url: body.thumbnail_url || null,
        primary_category: body.primary_category || null,
        sub_category: body.sub_category || null,
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
    const supabase = await createClient();
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
