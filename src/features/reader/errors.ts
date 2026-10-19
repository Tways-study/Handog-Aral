import type { OcrErrorCode } from "@/lib/ocr/engine";

export type ScanErrorKey = "errorNoText" | "errorOfflinePack" | "errorFailed";

/** Maps an OCR error code to the scan string key shown to the child. `aborted` is silent. */
export function ocrErrorKey(code: OcrErrorCode | null): ScanErrorKey | null {
  switch (code) {
    case "no_text":
      return "errorNoText";
    case "offline_pack_missing":
      return "errorOfflinePack";
    case "failed":
      return "errorFailed";
    default:
      return null;
  }
}
