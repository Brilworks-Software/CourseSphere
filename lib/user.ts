import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { supabase } from "./supabaseClient";
import {
  DEFAULT_AVATAR_URL,
  generateAvatarUrl,
  APP_PRIMARY_COLOR,
} from "./utils";
import { TokenManager } from "./token-manager";
import {
  createAuthenticatedServerClient,
  createSupabaseAdmin,
} from "./supabase/server";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = {
  email: string;
  password: string;
};

type ValidateLoginResult =
  | { success: true; data: LoginData }
  | { success: false; error: string };

export async function validateLoginData(
  data: Partial<LoginData>
): Promise<ValidateLoginResult> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation error",
    };
  }
  return { success: true, data: parsed.data };
}

// -----------------------------
// USER LOGIN
// -----------------------------
export async function userLogin(
  userData: Partial<LoginData>
): Promise<
  | { success: false; error: string }
  | { success: true; response: NextResponse; session: any }
> {
  const { email = "", password = "" } = userData;

  const validationResult = await validateLoginData({ email, password });
  if (!validationResult.success)
    return { success: false, error: validationResult.error };

  try {
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) return { success: false, error: loginError.message };
    if (!data.session || !data.user)
      return { success: false, error: "Login failed" };

    // Store tokens
    const tokenData = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:
        data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      user_id: data.user.id,
    };

    const response = NextResponse.json({
      success: true,
      user: data.user,
    });
    TokenManager.setTokens(tokenData, response);
    // Return session data for API to use in response
    return {
      success: true,
      response,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
      },
    };
  } catch (err) {
    console.error("Login error:", err);
    const errorMessage =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as any).message)
        : "Login failed";
    return { success: false, error: errorMessage };
  }
}

// -----------------------------
// PROFILE IMAGE UPLOAD
// -----------------------------
export async function uploadUserProfileImage(
  image: File | null
): Promise<{ success: boolean; img_url?: string; error?: string }> {
  let img_url = DEFAULT_AVATAR_URL;
  const authenticatedSupabase = await createAuthenticatedServerClient();
  const userID = uuidv4();

  if (image && image instanceof File) {
    const ext = image.name.split(".").pop();
    const fileName = `${userID}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await authenticatedSupabase.storage
      .from("userprofile")
      .upload(fileName, image, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return { success: false, error: "Image upload failed" };
    }

    const { data: publicUrlData } = authenticatedSupabase.storage
      .from("userprofile")
      .getPublicUrl(fileName);
    img_url = publicUrlData.publicUrl;
  }

  return { success: true, img_url };
}

// -----------------------------
// USER SIGNUP
// -----------------------------
type UserSignUpData = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  password?: string | null;
  role: string;
  organizationId?: string | null;
  profilePicture?: File | null;
  gender?: string | null;
};

export async function userSignUp(
  userData: UserSignUpData
): Promise<{ success: boolean; data: any; error?: string }> {
  console.log("userSignUp received:", userData);
  const {
    firstName = null,
    lastName = null,
    email = null,
    password = null,
    role = null,
    organizationId = null,
    profilePicture = null,
    gender = null,
  } = userData;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const adminClient = await createSupabaseAdmin();

  // Step 1: Upload profile image
  let profile_picture_url = DEFAULT_AVATAR_URL;
  if (profilePicture) {
    const { success, img_url: uploadedImgUrl } = await uploadUserProfileImage(
      profilePicture
    );
    if (!success)
      return { success: false, data: null, error: "Image upload failed" };
    profile_picture_url = uploadedImgUrl || DEFAULT_AVATAR_URL;
  } else {
    // Use firstName or lastName for avatar, fallback to "User"
    const avatarName = firstName?.trim() || lastName?.trim() || "User";
    profile_picture_url = generateAvatarUrl(avatarName, APP_PRIMARY_COLOR);
  }

  // Step 2: Create user in Supabase Auth
  const userMetaData = {
    first_name: firstName,
    last_name: lastName,
    profile_picture_url,
    role,
    gender,
    organization_id: organizationId,
    is_verified: false,
    deleted_at: null,
  };

  const { data, error } = await adminClient.auth.admin.createUser({
    email: email ?? undefined,
    password: password ?? undefined,
    user_metadata: userMetaData,
    email_confirm: false,
  });

  if (error) {
    console.error("Supabase Auth error:", error);
    return { success: false, data: null, error: error.message };
  }

  // Step 3: Send verification email
  const { error: resendError } = await adminClient.auth.resend({
    type: "signup",
    email: email!,
    options: {
      emailRedirectTo: `${baseUrl}/auth/verify-user?redirect=${baseUrl}/login`,
    },
  });

  if (resendError) {
    console.error("Email resend error:", resendError);
    return { success: false, data: null, error: resendError.message };
  }

  // Step 4: Insert into `users` table (using admin client)
  const userRow = {
    id: data.user.id,
    email: email ?? "",
    first_name: firstName ?? "",
    last_name: lastName ?? "",
    gender: gender ?? "",
    profile_picture_url,
    role: role ?? "org_employee",
    organization_id: organizationId ?? null,
    is_verified: false,
    deleted_at: null,
  };

  const { error: userError } = await adminClient.from("users").insert(userRow);
  if (userError) {
    console.error("User table insert error:", userError);
    return { success: false, data: null, error: userError.message };
  }

  return { success: true, data };
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };

    TokenManager.clearTokens(new NextResponse());
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as any).message)
        : "Logout failed";
    return { success: false, error: errorMessage };
  }
}
