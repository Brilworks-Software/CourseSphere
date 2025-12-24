import { createClient } from "@/lib/supabase/client";

export async function POST(req: Request) {
  const { lessonId } = await req.json();
  const supabase = createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
