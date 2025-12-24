export const GET = async () => {
  return new Response(JSON.stringify({ message: "Dashboard" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};