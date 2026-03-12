import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; couponId: string }> },
) {
  try {
    const { id, couponId } = await context.params;
    const supabase = await createClient();

    const body = await request.json();
    const { instructorId } = body;
    
    if (!instructorId) {
      return NextResponse.json({ error: "Unauthorized: Missing instructorId" }, { status: 401 });
    }
    const updateFields: any = {};
    const allowedFields = [
      "code",
      "discount_type",
      "discount_value",
      "min_purchase_amount",
      "max_uses",
      "valid_until",
      "is_active",
    ];

    for (const key of allowedFields) {
      if (Object.hasOwn(body, key)) {
        if (key === "code" && typeof body[key] === "string") {
           const newCode = body[key];
           if (newCode.length > 20) {
             return NextResponse.json({ error: "Coupon code must be at most 20 characters long" }, { status: 400 });
           }
           if (!/^[a-zA-Z0-9_\-]+$/.test(newCode)) {
             return NextResponse.json({ error: "Coupon code can only contain letters, numbers, dashes, and underscores" }, { status: 400 });
           }
           updateFields[key] = newCode;
        } else {
           updateFields[key] = body[key];
        }
      }
    }

    const { data: updatedCoupon, error } = await supabase
      .from("coupons")
      .update(updateFields)
      .eq("id", couponId)
      .eq("course_id", id)
      .select()
      .single();

    if (error) {
       if (error.code === '23505') {
         return NextResponse.json({ error: "Coupon code already exists." }, { status: 400 });
       }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(updatedCoupon);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; couponId: string }> },
) {
  try {
    const { id, couponId } = await context.params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if it's already used
    const { data: coupon } = await supabase
      .from("coupons")
      .select("used_count")
      .eq("id", couponId)
      .single();

    if (coupon && coupon.used_count && coupon.used_count > 0) {
      return NextResponse.json(
        { error: "Cannot delete a coupon that has been used. Deactivate it instead." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", couponId)
      .eq("course_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
