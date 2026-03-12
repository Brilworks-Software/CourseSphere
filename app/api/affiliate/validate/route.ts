import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/affiliate/validate
 *
 * Body: { referralCode: string, courseId?: string, clickData?: { ip: string, userAgent: string } }
 *
 * Validates affiliate referral code and optionally tracks click
 */
export async function POST(req: Request) {
  try {
    const { referralCode, courseId, clickData } = await req.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: "referralCode is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Validate affiliate profile
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliate_profiles")
      .select("id, user_id, referral_code, commission_rate, is_active")
      .eq("referral_code", referralCode)
      .eq("is_active", true)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { error: "Invalid or inactive affiliate code" },
        { status: 404 },
      );
    }

    // Track click if provided
    if (clickData && courseId) {
      const { error: clickError } = await supabase
        .from("affiliate_clicks")
        .insert({
          affiliate_id: affiliate.id,
          course_id: courseId,
          referral_code: referralCode,
          ip_address: clickData.ip,
          user_agent: clickData.userAgent,
        });

      if (clickError) {
        console.error("[affiliate/validate] Error tracking click:", clickError);
      }

      // Update click count for affiliate link (if exists)
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
    }

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        userId: affiliate.user_id,
        referralCode: affiliate.referral_code,
        commissionRate: affiliate.commission_rate,
      },
    });
  } catch (error: any) {
    console.error("[affiliate/validate] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
