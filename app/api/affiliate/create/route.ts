import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/affiliate/create
 *
 * Body: { userId: string }
 *
 * Creates an affiliate profile for a user with unique referral code
 */
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if user already has an affiliate profile
    const { data: existingProfile } = await supabase
      .from("affiliate_profiles")
      .select("id, referral_code")
      .eq("user_id", userId)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "User already has an affiliate profile",
          referralCode: existingProfile.referral_code,
        },
        { status: 409 },
      );
    }

    // Generate unique referral code
    const generateReferralCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let referralCode = "";
    let isUnique = false;
    let attempts = 0;

    // Try to generate a unique referral code (max 10 attempts)
    while (!isUnique && attempts < 10) {
      referralCode = generateReferralCode();

      const { data: existing } = await supabase
        .from("affiliate_profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single();

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Failed to generate unique referral code. Please try again." },
        { status: 500 },
      );
    }

    // Create affiliate profile
    const { data: profile, error: profileError } = await supabase
      .from("affiliate_profiles")
      .insert({
        user_id: userId,
        referral_code: referralCode,
        commission_rate: 20, // Default 20%
        total_sales: 0,
        total_earnings: 0,
        is_active: true,
      })
      .select("id, referral_code, commission_rate")
      .single();

    if (profileError) {
      console.error("[affiliate/create] Error creating profile:", profileError);
      return NextResponse.json(
        { error: "Failed to create affiliate profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        referralCode: profile.referral_code,
        commissionRate: profile.commission_rate,
      },
    });
  } catch (error: any) {
    console.error("[affiliate/create] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
