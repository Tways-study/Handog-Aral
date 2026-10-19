import { isReachable, ocrRemote } from "@/lib/api";
import { cleanOcrText } from "./postprocess";
import { prepareForAI, prepareForTesseract } from "./preprocess";
import { recognizeLocal, TesseractLoadError } from "./tesseract";

export type OcrErrorCode = "no_text" | "offline_pack_missing" | "aborted" | "failed";

export class OcrError extends Error {
  constructor(
    public code: OcrErrorCode,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? code, options);
    this.name = "OcrError";
  }
}

export interface RecognizeResult {
  text: string;
  source: "ai" | "offline";
}

export interface RecognizePageOptions {
  signal?: AbortSignal;
  /** 0..1, monotonic. */
  onProgress?: (p: number) => void;
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException ? err.name === "AbortError" : err instanceof OcrError && err.code === "aborted";
}

export async function recognizePage(file: Blob, opts: RecognizePageOptions = {}): Promise<RecognizeResult> {
  const { signal } = opts;
  let last = 0;
  const progress = (p: number) => {
    if (signal?.aborted) return;
    last = Math.max(last, p);
    opts.onProgress?.(last);
  };
  const check = () => {
    if (signal?.aborted) throw new OcrError("aborted");
  };

  try {
    check();
    progress(0);

    if (typeof navigator !== "undefined" && navigator.onLine && (await isReachable({ signal }))) {
      check();
      progress(0.1);
      const image = await prepareForAI(file);
      check();
      progress(0.2);
      const res = await ocrRemote(image, { signal });
      check();
      if (res.ok) {
        const text = cleanOcrText(res.data.text);
        if (text) {
          progress(1);
          return { text, source: "ai" };
        }
      }
      // rate_limited / error / empty -> fall through to offline.
    }

    check();
    const image = await prepareForTesseract(file);
    check();
    const raw = await recognizeLocal(image, { signal, onProgress: (p) => progress(p) });
    check();
    const text = cleanOcrText(raw);
    if (!text) throw new OcrError("no_text");
    progress(1);
    return { text, source: "offline" };
  } catch (err) {
    if (signal?.aborted || isAbort(err)) throw new OcrError("aborted", undefined, { cause: err });
    if (err instanceof OcrError) throw err;
    if (err instanceof TesseractLoadError) {
      throw new OcrError("offline_pack_missing", undefined, { cause: err });
    }
    throw new OcrError("failed", undefined, { cause: err });
  }
}
