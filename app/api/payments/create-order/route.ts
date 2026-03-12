import { createClient } from "@/lib/supabase/client";
import { getRazorpayInstance, isRazorpayEnabled } from "@/lib/razorpay";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create-order
 *
 * Body: { courseId: string, userId: string }
 *
 * 1. Guard Razorpay feature flag
 * 2. Fetch course price from DB
 * 3. Guard free courses
 * 4. Guard duplicate purchase
 * 5. Create Razorpay order
 * 6. Persist order in payment_orders
 * 7. Return order data to client
 */
export async function POST(req: Request) {
  try {
    // Feature-flag gate
    if (!isRazorpayEnabled()) {
      return NextResponse.json(
        { error: "Payment is not enabled on this platform." },
        { status: 503 },
      );
    }

    const { courseId, userId, couponCode, affiliateCode } = await req.json();

    if (!courseId || !userId) {
      return NextResponse.json(
        { error: "courseId and userId are required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, is_free, price")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (course.is_free) {
      return NextResponse.json(
        { error: "This course is free. Use the free enroll endpoint." },
        { status: 400 },
      );
    }

    let finalPrice = course.price;
    let couponId = null;
    let referralDiscountApplied = false;

    // First, check for affiliate code and apply 10% referral discount
    let affiliateId = null;
    if (affiliateCode) {
      const { data: affiliateData, error: affiliateError } = await supabase
        .from("affiliate_profiles")
        .select("id, user_id")
        .eq("referral_code", affiliateCode)
        .eq("is_active", true)
        .single();

      if (!affiliateError && affiliateData) {
        // Prevent users from using their own affiliate link
        if (affiliateData.user_id !== userId) {
          affiliateId = affiliateData.id;

          // Apply 10% referral discount
          const referralDiscountAmount = Math.round((course.price * 10) / 100);
          finalPrice = course.price - referralDiscountAmount;
          referralDiscountApplied = true;

          console.log("[create-order] Referral discount applied:", {
            originalPrice: course.price,
            discountAmount: referralDiscountAmount,
            finalPrice: finalPrice,
            affiliateCode: affiliateCode,
          });
        }
      }
    }

    // Then, apply coupon code on top of referral discount (if any)
    if (couponCode) {
      const { data: couponData, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .single();

      if (couponError || !couponData) {
        return NextResponse.json(
          { error: "Invalid coupon code" },
          { status: 404 },
        );
      }

      const currentDate = new Date();
      if (
        !couponData.is_active ||
        (couponData.course_id && couponData.course_id !== courseId) ||
        (couponData.valid_until &&
          new Date(couponData.valid_until) < currentDate) ||
        (couponData.max_uses !== null &&
          couponData.used_count >= couponData.max_uses) ||
        (couponData.min_purchase_amount &&
          course.price < couponData.min_purchase_amount)
      ) {
        return NextResponse.json(
          { error: "Coupon is not applicable or expired." },
          { status: 400 },
        );
      }

      let discountAmount = 0;
      if (couponData.discount_type === "percentage") {
        // Apply coupon discount on the current final price (after referral discount if applied)
        discountAmount = (finalPrice * couponData.discount_value) / 100;
      } else if (couponData.discount_type === "fixed") {
        discountAmount = couponData.discount_value;
      }

      if (
        couponData.max_discount_amount &&
        discountAmount > couponData.max_discount_amount
      ) {
        discountAmount = couponData.max_discount_amount;
      }

      finalPrice = finalPrice - Math.round(discountAmount);
      if (finalPrice < 0) finalPrice = 0;
      couponId = couponData.id;

      console.log("[create-order] Coupon discount applied:", {
        couponCode: couponCode,
        discountAmount: discountAmount,
        finalPrice: finalPrice,
        referralDiscountAlreadyApplied: referralDiscountApplied,
      });
    }

    const priceInPaise = finalPrice * 100; // stored as paise in DB (bigint)

    if (!priceInPaise || priceInPaise <= 0) {
      if (finalPrice === 0) {
        return NextResponse.json(
          {
            error:
              "Price after discount is zero. Please use free enroll endpoint.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Invalid course price." },
        { status: 400 },
      );
    }

    // Duplicate purchase check
    const { data: existingPurchase } = await supabase
      .from("course_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You have already purchased this course." },
        { status: 409 },
      );
    }

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    const receipt = `rcpt_${userId.slice(0, 8)}_${courseId.slice(0, 8)}_${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: priceInPaise,
      currency: "INR",
      receipt,
      notes: {
        course_id: courseId,
        user_id: userId,
        course_title: course.title,
      },
    });

    // Persist order in payment_orders
    const { data: dbOrder, error: dbOrderError } = await supabase
      .from("payment_orders")
      .insert({
        user_id: userId,
        course_id: courseId,
        razorpay_order_id: razorpayOrder.id,
        amount: priceInPaise,
        currency: "INR",
        status: "created",
        receipt,
        coupon_id: couponId,
        affiliate_id: affiliateId,
      })
      .select("id")
      .single();

    if (dbOrderError || !dbOrder) {
      return NextResponse.json(
        { error: "Failed to save payment order. Please try again." },
        { status: 500 },
      );
    }

    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY;

    const response = {
      orderId: razorpayOrder.id,
      dbOrderId: dbOrder.id,
      amount: priceInPaise,
      currency: "INR",
      key: razorpayKey,
      priceBredown: {
        originalPrice: course.price,
        finalPrice: finalPrice,
        referralDiscountApplied: referralDiscountApplied,
        referralDiscountAmount: referralDiscountApplied
          ? Math.round((course.price * 10) / 100)
          : 0,
        couponApplied: couponId ? true : false,
        totalSavings: course.price - finalPrice,
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[create-order] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error." },
      { status: 500 },
    );
  }
}
