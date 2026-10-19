import { OcrRequestSchema } from "@/shared/schemas";
import { preflight } from "@/server/cors";
import { transcribePage } from "@/server/gemini";
import { errorResponse, handlePost, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ~4MB image as base64 (5.6M chars, matching OcrRequestSchema) plus the JSON envelope.
const MAX_BYTES = 5_700_000;

export function OPTIONS(req: Request): Response {
  return preflight(req);
}

export function POST(req: Request): Promise<Response> {
  return handlePost(req, { kind: "ocr", maxBytes: MAX_BYTES }, async (body, origin) => {
    const parsed = OcrRequestSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, "invalid", origin);
    return json({ text: await transcribePage(parsed.data) }, 200, origin);
  });
}
