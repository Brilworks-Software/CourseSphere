import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    // Fetch lesson transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from("lesson_transcripts")
      .select("*")
      .eq("lesson_id", lessonId)
      .single();

    if (transcriptError && transcriptError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return NextResponse.json(
        { error: transcriptError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      transcript: transcript || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
