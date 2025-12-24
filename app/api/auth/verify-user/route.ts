import { TokenManager } from "@/lib/token-manager";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token, expires_at } = await req.json();
    if (!access_token || !refresh_token || !expires_at) {
      return NextResponse.json(
        { error: "Missing tokens" },
        {
          status: 400,
        }
      );
    }

    // Extract user_id from access token
    const user_id = TokenManager.getUserIdFromToken(access_token);

    // Set cookies on response
    const tokenData = {
      access_token,
      refresh_token,
      expires_at: parseInt(expires_at, 10),
      user_id: user_id,
    };
    const response = NextResponse.json({ success: true });
    TokenManager.setTokens(tokenData, response);

    // Update user invitation status if user_id is available
    // if (user_id) {
    //     try {
    //         const supabase = await getSupabaseServer();
    //         const { data: user, error: userError } = await supabase.from(
    //             "user",
    //         )
    //             .update({ invitation_status: INVITATION_STATUS.ACCEPTED })
    //             .eq("clerk_user_id", user_id)
    //             .eq("isDeleted", false)
    //             .single();

    //         if (userError) {
    //             console.error("verify-user-Error", userError);
    //             // Don't fail the entire request if user update fails
    //             // Just log the error and continue
    //         } else {
    //             console.log(
    //                 "User invitation status updated successfully:",
    //                 user,
    //             );
    //         }
    //     } catch (updateError) {
    //         console.error(
    //             "Error updating user invitation status:",
    //             updateError,
    //         );
    //         // Don't fail the entire request if user update fails
    //     }
    // }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Failed to verify session",
      },
      { status: 500 }
    );
  }
}
