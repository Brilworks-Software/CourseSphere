import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: coupons, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("course_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(coupons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const body = await request.json();
    const {
      code,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_uses,
      valid_until,
      is_active,
      instructorId
    } = body;

    if (!code || !discount_type || discount_value === undefined || !instructorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (code.length > 20) {
      return NextResponse.json({ error: "Coupon code must be at most 20 characters long" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(code)) {
      return NextResponse.json({ error: "Coupon code can only contain letters, numbers, dashes, and underscores" }, { status: 400 });
    }

    // Insert coupon
    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        course_id: id,
        code: code,
        discount_type,
        discount_value,
        min_purchase_amount: min_purchase_amount || 0,
        max_uses: max_uses || null,
        valid_until: valid_until || null,
        is_active: is_active ?? true,
        created_by: instructorId
      })
      .select()
      .single();

    if (error) {
       // Check for duplicate code
       if (error.code === '23505') {
         return NextResponse.json({ error: "Coupon code already exists." }, { status: 400 });
       }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
