import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/dashboard?userId={userId}
 *
 * Gets affiliate dashboard data including stats, commissions, and links
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get affiliate profile
    const { data: profile, error: profileError } = await supabase
      .from("affiliate_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Affiliate profile not found" },
        { status: 404 },
      );
    }

    // Get commissions (simplified query first)
    const { data: commissions, error: commissionsError } = await supabase
      .from("affiliate_commissions")
      .select("*")
      .eq("affiliate_id", profile.id)
      .order("created_at", { ascending: false });


    // If we get commissions, try to enrich with related data
    let enrichedCommissions = commissions || [];
    if (commissions && commissions.length > 0) {
      // Try to get course and user data separately to avoid JOIN issues
      for (let commission of commissions) {
        try {
          const { data: courseData } = await supabase
            .from("courses")
            .select("title, thumbnail_url")
            .eq("id", commission.course_id)
            .single();

          const { data: userData } = await supabase
            .from("users")
            .select("full_name, email")
            .eq("id", commission.user_id)
            .single();

          commission.courses = courseData;
          commission.users = userData;
        } catch (error) {
          console.log(
            "[affiliate/dashboard] Error enriching commission:",
            error,
          );
        }
      }
      enrichedCommissions = commissions;
    }

    if (commissionsError) {
      console.error(
        "[affiliate/dashboard] Error fetching commissions:",
        commissionsError,
      );
    }

    // Get affiliate links with course details
    const { data: links, error: linksError } = await supabase
      .from("affiliate_links")
      .select(
        `
        *,
        courses:course_id (title, price, thumbnail_url)
      `,
      )
      .eq("affiliate_id", profile.id)
      .order("created_at", { ascending: false });

    if (linksError) {
      console.error("[affiliate/dashboard] Error fetching links:", linksError);
    }

    // Get recent clicks
    const { data: recentClicks, error: clicksError } = await supabase
      .from("affiliate_clicks")
      .select(
        `
        *,
        courses:course_id (title)
      `,
      )
      .eq("affiliate_id", profile.id)
      .order("clicked_at", { ascending: false })
      .limit(50);

    if (clicksError) {
      console.error(
        "[affiliate/dashboard] Error fetching clicks:",
        clicksError,
      );
    }

    // Calculate stats
    const totalCommissions = enrichedCommissions?.length || 0;
    const pendingCommissions =
      enrichedCommissions?.filter((c) => c.status === "pending").length || 0;
    const approvedCommissions =
      enrichedCommissions?.filter((c) => c.status === "approved").length || 0;
    const paidCommissions =
      enrichedCommissions?.filter((c) => c.status === "paid").length || 0;

    const totalEarningsPaise =
      enrichedCommissions?.reduce(
        (sum, c) => sum + (c.commission_amount || 0),
        0,
      ) || 0;
    const pendingEarningsPaise =
      enrichedCommissions
        ?.filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;
    const paidEarningsPaise =
      enrichedCommissions
        ?.filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

    const totalClicks = recentClicks?.length || 0;
    const conversionRate =
      totalClicks > 0 ? (totalCommissions / totalClicks) * 100 : 0;

    return NextResponse.json({
      profile: {
        id: profile.id,
        referralCode: profile.referral_code,
        commissionRate: profile.commission_rate,
        totalSales: profile.total_sales,
        totalEarnings: profile.total_earnings,
        isActive: profile.is_active,
        createdAt: profile.created_at,
      },
      stats: {
        totalCommissions,
        pendingCommissions,
        approvedCommissions,
        paidCommissions,
        totalEarnings: Math.floor(totalEarningsPaise / 100), // Convert to rupees
        pendingEarnings: Math.floor(pendingEarningsPaise / 100),
        paidEarnings: Math.floor(paidEarningsPaise / 100),
        totalClicks,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
      },
      commissions: enrichedCommissions || [],
      links: links || [],
      recentClicks: recentClicks || [],
    });
  } catch (error: any) {
    console.error("[affiliate/dashboard] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
