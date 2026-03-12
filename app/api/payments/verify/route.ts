import { createClient } from "@/lib/supabase/client";
import { isRazorpayEnabled } from "@/lib/razorpay";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/verify
 *
 * Body: {
 *   razorpay_payment_id: string
 *   razorpay_order_id:   string
 *   razorpay_signature:  string
 * }
 *
 * 1. Guard flag
 * 2. Verify HMAC signature
 * 3. Look up payment_orders to get user_id + course_id
 * 4. Insert payment_transactions
 * 5. Insert course_purchases
 * 6. Insert enrollment (idempotent — catches duplicate constraint)
 * 7. Update payment_orders.status → 'paid'
 */
export async function POST(req: Request) {
  try {

    if (!isRazorpayEnabled()) {
      console.warn("[verify] Razorpay is disabled via feature flag");
      return NextResponse.json(
        { error: "Payment is not enabled on this platform." },
        { status: 503 },
      );
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.warn("[verify] Missing verification parameters");
      return NextResponse.json(
        { error: "Missing payment verification parameters." },
        { status: 400 },
      );
    }
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error("[verify] RAZORPAY_KEY_SECRET is not available");
      return NextResponse.json(
        { error: "Payment verification is not properly configured." },
        { status: 500 },
      );
    }
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error(
        "[verify] Signature verification failed - signatures do not match",
      );
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
   
    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .select(
        "id, user_id, course_id, amount, currency, coupon_id, affiliate_id",
      )
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (orderError || !order) {
      console.error(
        "[verify] Payment order not found - razorpay_order_id:",
        razorpay_order_id,
        "error:",
        orderError,
      );
      return NextResponse.json(
        { error: "Payment order not found in database." },
        { status: 404 },
      );
    }

    const {
      id: dbOrderId,
      user_id,
      course_id,
      amount,
      currency,
      coupon_id,
      affiliate_id,
    } = order;

    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: dbOrderId,
        user_id,
        course_id,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount,
        currency,
        payment_status: "success",
      })
      .select("id")
      .single();

    if (txError) {
      // Duplicate payment_id — already processed
      if (txError.code === "23505") {
        console.warn(
          "[verify] Duplicate payment detected - payment already processed - payment_id:",
          razorpay_payment_id,
        );
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }
      console.error(
        "[verify] Failed to record payment transaction - error:",
        txError,
      );
      return NextResponse.json(
        { error: "Failed to record payment transaction." },
        { status: 500 },
      );
    }

    await supabase.from("course_purchases").insert({
      user_id,
      course_id,
      transaction_id: transaction.id,
      purchase_price: amount,
    });

    // 4.5 Insert coupon_redemptions if coupon was used
    if (coupon_id) {

      // Calculate discount conceptually or just fetch the course price to compute the difference
      const { data: courseData } = await supabase
        .from("courses")
        .select("price")
        .eq("id", course_id)
        .single();
      const originalPrice = courseData?.price || 0;
      const discountAmount = originalPrice - Math.floor(amount / 100);

      await supabase.from("coupon_redemptions").insert({
        coupon_id,
        user_id,
        course_id,
        order_id: dbOrderId,
        discount_amount: discountAmount,
      });

      // Increment used_count for coupon
      const { data: couponRecord } = await supabase
        .from("coupons")
        .select("used_count")
        .eq("id", coupon_id)
        .single();
      if (couponRecord) {
        await supabase
          .from("coupons")
          .update({ used_count: couponRecord.used_count + 1 })
          .eq("id", coupon_id);
      }

    }

    if (affiliate_id) {
      console.log(
        "[verify] Recording affiliate commission for affiliate_id:",
        affiliate_id,
      );

      // Get affiliate commission rate
      const { data: affiliateData, error: affiliateError } = await supabase
        .from("affiliate_profiles")
        .select("commission_rate, total_sales, total_earnings")
        .eq("id", affiliate_id)
        .single();

      if (affiliateError) {
        console.error(
          "[verify] Error fetching affiliate data:",
          affiliateError,
        );
      }

      if (affiliateData) {
        const commissionRate = affiliateData.commission_rate;
        const finalAmountInCurrency = Math.floor(amount / 100); // Convert paise to rupees
        const commissionAmount = Math.round(
          (finalAmountInCurrency * commissionRate) / 100,
        );

        // Record commission
        const { error: commissionError } = await supabase
          .from("affiliate_commissions")
          .insert({
            affiliate_id,
            user_id,
            course_id,
            order_id: dbOrderId,
            coupon_id: coupon_id || null,
            commission_rate: commissionRate,
            commission_amount: commissionAmount * 100, // Store in paise
            status: "pending",
          });

        if (commissionError) {
          console.error(
            "[verify] Failed to record affiliate commission:",
            commissionError,
          );
        } else {

          // Update affiliate profile stats
          const updateResult = await supabase
            .from("affiliate_profiles")
            .update({
              total_sales: affiliateData.total_sales + 1,
              total_earnings:
                affiliateData.total_earnings + commissionAmount * 100,
            })
            .eq("id", affiliate_id);

          if (updateResult.error) {
            console.error(
              "[verify] Error updating affiliate stats:",
              updateResult.error,
            );
          }

        }
      } else {
        console.error("[verify] No affiliate data found for id:", affiliate_id);
      }
    } 

    const { error: enrollError } = await supabase.from("enrollments").insert({
      student_id: user_id,
      course_id,
    });

    await supabase
      .from("payment_orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", dbOrderId);

    return NextResponse.json({ success: true, alreadyProcessed: false });
  } catch (err: any) {
    console.error("[verify] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error." },
      { status: 500 },
    );
  }
}
