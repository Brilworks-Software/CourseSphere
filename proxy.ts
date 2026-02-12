import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// Only read cookies in middleware. Never set or clear cookies here!

const protectedRoutes = [
  "/dashboard",
  "/courses",
  "/organization",
  "/profile",
  "/admin",
];

function isProtectedRoute(pathname: string): boolean {
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  return isProtected;
}

function isAuthPage(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/public/")
  ) {
    return NextResponse.next();
  }

  // Create response object
  const response = NextResponse.next();

  if (request.nextUrl.pathname === "/login") {
    response.cookies.delete("orgId");
    response.cookies.delete("userId");
    response.cookies.delete("showDemoRecords");
  }

  // Only read cookies
  const accessToken = request.cookies.get("sb-auth-token")?.value;
  const userId = request.cookies.get("sb-user-id")?.value;

  // If it's an auth page (sign-in, sign-up, forgot-password, reset-password), allow access
  if (isAuthPage(pathname)) {
    // If user is already authenticated and trying to access auth pages, redirect to dashboard
    if (
      accessToken &&
      (pathname.startsWith("/login") || pathname.startsWith("/signup"))
    ) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    // Allow access to auth pages for unauthenticated users
    return response;
  }

  // If protected route and not authenticated, redirect to sign-in
  if (isProtectedRoute(pathname) && !accessToken) {
    const signInUrl = new URL("/login", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Return the response with cookies
  // Never set or clear cookies using token-manager in middleware!
  return response;
}

export const config = {
  matcher:
    // ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
    ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * Feel free to modify this pattern to include more paths.
//      */
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }
