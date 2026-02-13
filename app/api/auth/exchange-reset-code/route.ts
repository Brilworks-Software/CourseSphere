import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { code } = await req.json();

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  console.log("exchange code data", data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
