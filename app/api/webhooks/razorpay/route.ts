import { createClient } from "@/lib/supabase/client";
import { isRazorpayEnabled } from "@/lib/razorpay";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay webhook safety net.
 * If the frontend fails AFTER payment, this endpoint still:
 *   - Records the transaction
 *   - Creates the course purchase
 *   - Grants enrollment
 *
 * Events handled:
 *   payment.captured  — successful capture
 *   payment.failed    — marks order as failed
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks
 * URL: https://yourdomain.com/api/webhooks/razorpay
 * Secret: RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  try {
    if (!isRazorpayEnabled()) {
      return NextResponse.json({ received: true });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("X-Razorpay-Signature") ?? "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    // Verify webhook signature
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { error: "Invalid webhook signature." },
          { status: 400 },
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const event: string = payload?.event ?? "";
    const paymentEntity = payload?.payload?.payment?.entity;

    const supabase = await createClient();

    if (event === "payment.captured") {
      const razorpay_payment_id: string = paymentEntity?.id ?? "";
      const razorpay_order_id: string = paymentEntity?.order_id ?? "";

      if (!razorpay_payment_id || !razorpay_order_id) {
        return NextResponse.json({ received: true });
      }

      // Look up order
      const { data: order } = await supabase
        .from("payment_orders")
        .select("id, user_id, course_id, amount, currency, status")
        .eq("razorpay_order_id", razorpay_order_id)
        .maybeSingle();

      if (!order) {
        // Unknown order — acknowledge and exit
        return NextResponse.json({ received: true });
      }

      // Skip if already paid (frontend already processed it)
      if (order.status === "paid") {
        return NextResponse.json({ received: true });
      }

      const { id: dbOrderId, user_id, course_id, amount, currency } = order;

      // Insert transaction (idempotent on razorpay_payment_id unique)
      const { data: transaction, error: txError } = await supabase
        .from("payment_transactions")
        .insert({
          order_id: dbOrderId,
          user_id,
          course_id,
          razorpay_payment_id,
          razorpay_order_id,
          amount,
          currency,
          payment_status: "success",
        })
        .select("id")
        .single();

      if (txError && txError.code !== "23505") {
        console.error("[webhook] transaction insert error:", txError);
        return NextResponse.json({ received: true });
      }

      // Insert purchase (only if transaction was freshly inserted)
      if (!txError && transaction) {
        await supabase.from("course_purchases").insert({
          user_id,
          course_id,
          transaction_id: transaction.id,
          purchase_price: amount,
        });

        // Enrollment (idempotent — ignore unique constraint)
        const { error: enrollError } = await supabase
          .from("enrollments")
          .insert({ student_id: user_id, course_id });
        if (enrollError && enrollError.code !== "23505") {
          console.error("[webhook] enrollment insert error:", enrollError);
        }
      }

      // Update order status
      await supabase
        .from("payment_orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", dbOrderId);
    }

    if (event === "payment.failed") {
      const razorpay_order_id: string = paymentEntity?.order_id ?? "";
      if (razorpay_order_id) {
        await supabase
          .from("payment_orders")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("razorpay_order_id", razorpay_order_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[webhook] error:", err);
    // Always return 200 to Razorpay to prevent retries on our own errors
    return NextResponse.json({ received: true });
  }
}
