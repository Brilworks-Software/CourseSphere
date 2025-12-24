import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  // Get user ID from query params
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  if (!userId) {
    return NextResponse.json(
      { user: null, error: "Missing user id" },
      { status: 400 }
    );
  }
  // Fetch user from Supabase users table
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !user) {
    return NextResponse.json(
      { user: null, error: error?.message || "User not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ user }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, ...rest } = body;

    if (action === "login") {
      // Example: check user in DB (replace with real logic)
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
      if (error || !user) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
      // Here you would set a cookie/session
      return NextResponse.json({ user }, { status: 200 });
    }

    if (action === "register") {
      // Example: create user in DB (replace with real logic)
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      if (existing) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }
      const { data: user, error } = await supabase
        .from("users")
        .insert([{ email, password, ...rest }])
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          { error: "Registration failed" },
          { status: 500 }
        );
      }
      // Here you would set a cookie/session
      return NextResponse.json({ user }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, schoolId, role } = body as {
      userId: string;
      schoolId: string;
      role: string;
    };

    // Validate required fields
    if (!userId || !schoolId || !role) {
      return NextResponse.json(
        { error: "Missing required fields: userId, schoolId, and role" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["student", "teacher"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: student, teacher, admin" },
        { status: 400 }
      );
    }

    // Update user profile
    const { data, error } = await supabase
      .from("users")
      .update({
        school_id: schoolId,
        role: role,
        is_approved: false, // Reset approval status when role changes
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "User profile updated successfully",
        user: data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
