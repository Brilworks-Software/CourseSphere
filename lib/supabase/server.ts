"use server";
import { TokenManager } from "@/lib/token-manager";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies as nextCookies } from "next/headers";

// Helper to get cookies (no explicit type for RequestCookies)
async function getCookieStore() {
  return nextCookies();
}

// Create a Supabase client for server-side usage (with anon key)
export async function createSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await getCookieStore();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[]
        ) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in server components
          }
        },
      },
    }
  );
}

// Create a Supabase admin client (with service role)
export async function createSupabaseAdmin(): Promise<SupabaseClient> {
  // createClient is synchronous, but this must be async for Server Actions compatibility
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Singleton for authenticated Supabase client
let authenticatedSupabaseInstance: SupabaseClient | null = null;

// Create an authenticated Supabase client (with access token)
export async function createAuthenticatedServerClient(): Promise<SupabaseClient> {
  if (authenticatedSupabaseInstance) {
    return authenticatedSupabaseInstance;
  }

  const accessToken = await TokenManager.getValidAccessToken();
  if (!accessToken) {
    throw new Error("No valid authentication token");
  }

  const cookieStore = await getCookieStore();

  authenticatedSupabaseInstance = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[]
        ) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in server components
          }
        },
      },
    }
  );

  return authenticatedSupabaseInstance;
}

// Singleton for anon Supabase client
let supabaseInstance: SupabaseClient | null = null;

// Get a singleton Supabase client for the server (anon)
export async function getSupabaseServer(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  const cookieStore = await getCookieStore();
  supabaseInstance = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[]
        ) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in server components
          }
        },
      },
    }
  );
  return supabaseInstance;
}
