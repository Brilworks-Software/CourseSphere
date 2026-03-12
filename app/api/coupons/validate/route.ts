import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { coupon, courseId } = await req.json();

    if (!coupon || !courseId) {
      return NextResponse.json(
        { error: "Coupon code and courseId are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the course price
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("price, is_free")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.is_free) {
      return NextResponse.json({ error: "Course is already free" }, { status: 400 });
    }

    // Fetch the coupon
    const { data: couponData, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", coupon)
      .single();

    if (couponError || !couponData) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    // Validation checks
    if (!couponData.is_active) {
      return NextResponse.json({ error: "This coupon is no longer active" }, { status: 400 });
    }

    if (couponData.course_id && couponData.course_id !== courseId) {
      return NextResponse.json({ error: "This coupon is not valid for this course" }, { status: 400 });
    }

    if (couponData.valid_until && new Date(couponData.valid_until) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    if (couponData.max_uses !== null && couponData.used_count >= couponData.max_uses) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    if (couponData.min_purchase_amount && course.price < couponData.min_purchase_amount) {
      return NextResponse.json(
        { error: `Minimum purchase amount of ₹${couponData.min_purchase_amount} required` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (couponData.discount_type === "percentage") {
      discountAmount = (course.price * couponData.discount_value) / 100;
    } else if (couponData.discount_type === "fixed") {
      discountAmount = couponData.discount_value;
    }

    if (couponData.max_discount_amount && discountAmount > couponData.max_discount_amount) {
      discountAmount = couponData.max_discount_amount;
    }

    let finalPrice = course.price - discountAmount;
    if (finalPrice < 0) finalPrice = 0;

    return NextResponse.json({
      valid: true,
      coupon_id: couponData.id,
      discount_type: couponData.discount_type,
      discount_value: couponData.discount_value,
      original_price: course.price,
      discount_amount: Math.round(discountAmount),
      final_price: Math.round(finalPrice),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
