import { NextResponse } from "next/server";
import { userLogin } from "@/lib/user";
import type { NextRequest } from "next/server";

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequestBody;
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const result = await userLogin({
      email,
      password,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If userLogin returns session info, return tokens in JSON for client-side management
    if (result.response && result.session) {
      const { access_token, refresh_token, expires_at, user } = result.session;
      result.response.headers.set("Content-Type", "application/json");
      return new NextResponse(
        JSON.stringify({
          success: true,
          access_token,
          refresh_token,
          expires_at,
          user_id: user?.id,
          user,
        }),
        {
          status: 200,
          headers: result.response.headers,
        }
      );
    }

    // Fallback: just return the response
    return result.response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
