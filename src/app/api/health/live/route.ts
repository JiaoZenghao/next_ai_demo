export const dynamic = "force-dynamic";

// Liveness checks the application process, never an external model service.
export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
