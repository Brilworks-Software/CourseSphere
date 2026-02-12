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
        },
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
    const response = NextResponse.json({ tokenData, success: true });
    TokenManager.setTokens(tokenData, response);

    return response;
  } catch (err: Error | unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to verify session",
      },
      { status: 500 },
    );
  }
}
