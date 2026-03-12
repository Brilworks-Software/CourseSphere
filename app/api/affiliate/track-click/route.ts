import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/affiliate/track-click
 *
 * Body: { referralCode: string, courseId: string, ip?: string, userAgent?: string }
 *
 * Tracks affiliate link clicks
 */
export async function POST(req: Request) {
  try {
    const { referralCode, courseId, ip, userAgent } = await req.json();

    if (!referralCode || !courseId) {
      return NextResponse.json(
        { error: "referralCode and courseId are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get affiliate profile
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliate_profiles")
      .select("id")
      .eq("referral_code", referralCode)
      .eq("is_active", true)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { error: "Invalid affiliate code" },
        { status: 404 },
      );
    }

    // Track click
    const { error: clickError } = await supabase
      .from("affiliate_clicks")
      .insert({
        affiliate_id: affiliate.id,
        course_id: courseId,
        referral_code: referralCode,
        ip_address: ip || null,
        user_agent: userAgent || null,
      });

    if (clickError) {
      console.error(
        "[affiliate/track-click] Error tracking click:",
        clickError,
      );
      return NextResponse.json(
        { error: "Failed to track click" },
        { status: 500 },
      );
    }

    // Update affiliate link click count
    const { data: linkData } = await supabase
      .from("affiliate_links")
      .select("id, click_count")
      .eq("affiliate_id", affiliate.id)
      .eq("course_id", courseId)
      .single();

    if (linkData) {
      await supabase
        .from("affiliate_links")
        .update({ click_count: linkData.click_count + 1 })
        .eq("id", linkData.id);
    } else {
      // Create affiliate link if it doesn't exist
      await supabase.from("affiliate_links").insert({
        affiliate_id: affiliate.id,
        course_id: courseId,
        referral_code: referralCode,
        click_count: 1,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Click tracked successfully",
    });
  } catch (error: any) {
    console.error("[affiliate/track-click] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
