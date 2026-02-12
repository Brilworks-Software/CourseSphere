import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type RouteContext = {
  params: {
    announcementId: string;
    commentId: string;
  };
};

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { commentId } = await context.params;
  if (!commentId) {
    return NextResponse.json(
      { error: "commentId is required" },
      { status: 400 },
    );
  }

  // Get user id from request body (for demo; in production, use session/auth)
  let user_id = "";
  try {
    const payload = await req.json();
    user_id = payload.user_id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow deleting if the comment belongs to the user
  const { data: comment, error: fetchError } = await supabase
    .from("course_discussion_replies")
    .select("id, user_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
  if (comment.user_id !== user_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("course_discussion_replies")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
