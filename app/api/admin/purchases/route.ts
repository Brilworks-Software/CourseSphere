import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  // Optionally, add admin authentication/authorization here
  const { data, error } = await supabase
    .from("course_purchases")
    .select(
      `
      id,
      user_id,
      course_id,
      transaction_id,
      purchase_price,
      purchased_at,
      course:course_id(title),
      user:user_id(email, first_name, last_name),
      transaction:transaction_id(razorpay_payment_id, amount, payment_status, paid_at)
    `,
    )
    .order("purchased_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ purchases: data });
}
