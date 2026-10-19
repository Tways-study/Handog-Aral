import { checkOrigin, corsHeaders, preflight } from "@/server/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request): Response {
  return preflight(req);
}

export function GET(req: Request): Response {
  const c = checkOrigin(req);
  if (!c.allowed) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders(c.origin) },
  });
}
