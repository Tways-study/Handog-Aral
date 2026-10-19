const ALWAYS_ALLOWED = ["https://localhost", "capacitor://localhost"];

export function allowedOrigins(): string[] {
  const extra = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return [...ALWAYS_ALLOWED, ...extra];
}

function requestHost(req: Request): string | null {
  return req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? safeHost(req.url);
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export type OriginCheck = { allowed: true; origin: string | null } | { allowed: false };

export function checkOrigin(req: Request): OriginCheck {
  const origin = req.headers.get("origin");
  if (!origin) return { allowed: true, origin: null };
  if (allowedOrigins().includes(origin)) return { allowed: true, origin };
  if (safeHost(origin) && safeHost(origin) === requestHost(req)) return { allowed: true, origin };
  return { allowed: false };
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = { Vary: "Origin" };
  if (origin) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

/** Handle an OPTIONS preflight. */
export function preflight(req: Request): Response {
  const c = checkOrigin(req);
  if (!c.allowed) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  return new Response(null, { status: 204, headers: { ...corsHeaders(c.origin), "Cache-Control": "no-store" } });
}
