// Wrapper POST handler that dynamically imports the TSX implementation.
// This avoids having JSX inside a `.ts` file which Turbopack parses as plain TS.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const mod = await import("./routeImpl");
  if (typeof mod.POST !== "function") {
    return new Response(
      JSON.stringify({ error: "PDF route implementation not found" }),
      { status: 500 },
    );
  }
  return mod.POST(req);
}
