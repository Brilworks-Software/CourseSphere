import { createBrowserClient } from "@supabase/ssr";
import type { CookieMethodsBrowser, CookieOptions } from "@supabase/ssr";
import { parse, serialize } from "cookie";

/**
 * Browser cookie helpers so PKCE code verifier and session are stored in
 * cookies (not localStorage), surviving logout and working with reset-password.
 */
function getBrowserCookieStorage(): CookieMethodsBrowser | undefined {
  if (typeof document === "undefined") return undefined;
  const getAll: CookieMethodsBrowser["getAll"] = () => {
    const parsed = parse(document.cookie);
    return Object.entries(parsed).map(([name, value]) => ({
      name,
      value: value ?? "",
    }));
  };
  const setAll: CookieMethodsBrowser["setAll"] = (
    cookies: { name: string; value: string; options: CookieOptions }[]
  ) => {
    cookies.forEach(({ name, value, options }) => {
      document.cookie = serialize(name, value ?? "", {
        path: options?.path ?? "/",
        sameSite:
          options?.sameSite === true || options?.sameSite === "strict"
            ? "strict"
            : options?.sameSite === "none"
              ? "none"
              : "lax",
        maxAge: options?.maxAge ?? 400 * 24 * 60 * 60,
      });
    });
  };
  return { getAll, setAll };
}

export function createClient() {
  const cookieStorage = getBrowserCookieStorage();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: false,
      ...(cookieStorage && { cookies: cookieStorage }),
    }
  );
}

// Alias for legacy callers in the app
export function createSupabaseClient() {
  return createClient();
}
