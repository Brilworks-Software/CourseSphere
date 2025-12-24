import { userSignUp } from "@/lib/user";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface RegisterRequestBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role : string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequestBody;
    const { email, password, firstName, lastName, role } = body;
    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const result = await userSignUp({
      email,
      password,
      firstName,
      lastName,
      role
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
