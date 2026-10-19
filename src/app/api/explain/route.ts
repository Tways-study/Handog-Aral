import { ExplainRequestSchema } from "@/shared/schemas";
import { preflight } from "@/server/cors";
import { explainWord } from "@/server/gemini";
import { errorResponse, handlePost, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024;

export function OPTIONS(req: Request): Response {
  return preflight(req);
}

export function POST(req: Request): Promise<Response> {
  return handlePost(req, { kind: "explain", maxBytes: MAX_BYTES }, async (body, origin) => {
    const parsed = ExplainRequestSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, "invalid", origin);
    return json(await explainWord(parsed.data), 200, origin);
  });
}
