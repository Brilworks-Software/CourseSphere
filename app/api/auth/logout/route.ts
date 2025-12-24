import { signOut } from "@/lib/user";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await signOut();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Logout API error:", err);
    return NextResponse.json(
      { error: err?.message || "Logout failed" },
      { status: 500 }
    );
  }
}
