// Re-export the actual implementation to keep a single implementation file.
// Note: `runtime` must be exported from this file as a top-level literal
// so Next.js can statically parse it. Do NOT re-export `runtime` from
// another module (that causes the Turbopack build error seen on Vercel).
export { POST } from "./routeImpl";

// Keep `runtime` as a local literal export so Next.js can read it at
// compile-time. Align this value with the runtime used in `routeImpl`.
export const runtime = "nodejs";
