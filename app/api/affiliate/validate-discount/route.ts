import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/affiliate/validate-discount
 *
 * Body: { affiliateCode: string, userId: string, courseId: string }
 *
 * Validates affiliate code and returns discount information
 */
export async function POST(req: Request) {
  try {
    const { affiliateCode, userId, courseId } = await req.json();

    if (!affiliateCode || !userId || !courseId) {
      return NextResponse.json(
        { error: "affiliateCode, userId, and courseId are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price, is_free")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.is_free) {
      return NextResponse.json(
        { error: "This course is free. No discount applicable." },
        { status: 400 },
      );
    }

    // Validate affiliate code
    const { data: affiliateData, error: affiliateError } = await supabase
      .from("affiliate_profiles")
      .select("id, user_id, referral_code, is_active")
      .eq("referral_code", affiliateCode)
      .eq("is_active", true)
      .single();

    if (affiliateError || !affiliateData) {
      return NextResponse.json(
        { error: "Invalid or inactive affiliate code" },
        { status: 404 },
      );
    }

    // Prevent users from using their own affiliate link
    if (affiliateData.user_id === userId) {
      return NextResponse.json(
        { error: "You cannot use your own affiliate code" },
        { status: 400 },
      );
    }

    // Calculate 10% discount
    const discountAmount = Math.round((course.price * 10) / 100);
    const finalPrice = course.price - discountAmount;

    return NextResponse.json({
      valid: true,
      discount: {
        type: "referral",
        percentage: 10,
        originalPrice: course.price,
        discountAmount: discountAmount,
        finalPrice: finalPrice,
        savings: discountAmount,
        affiliateCode: affiliateCode,
      },
      course: {
        id: course.id,
        title: course.title,
        price: course.price,
      },
    });
  } catch (error: any) {
    console.error("[affiliate/validate-discount] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
