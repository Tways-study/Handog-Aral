// Browser-only image preparation. Never import from server code.
import { contrastStretch, fitLongEdge, grayscale } from "./pixels";

export { contrastStretch, fitLongEdge, grayscale };

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

function makeCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toBlob(canvas: AnyCanvas, type: string, quality?: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality),
  );
}

function ctx2d(canvas: AnyCanvas) {
  const c = canvas.getContext("2d", { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!c) throw new Error("2d canvas unavailable");
  return c;
}

async function drawFitted(file: Blob, min: number, max: number) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const { width, height } = fitLongEdge(bitmap.width, bitmap.height, min, max);
    const canvas = makeCanvas(width, height);
    const c = ctx2d(canvas);
    c.imageSmoothingQuality = "high";
    c.drawImage(bitmap, 0, 0, width, height);
    return { canvas, c, width, height };
  } finally {
    bitmap.close();
  }
}

/** EXIF-corrected, long edge <= 2000px, JPEG q0.85. Small images are not upscaled. */
export async function prepareForAI(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const long = Math.max(bitmap.width, bitmap.height);
    const { width, height } = fitLongEdge(bitmap.width, bitmap.height, Math.min(long, 2000), 2000);
    const canvas = makeCanvas(width, height);
    const c = ctx2d(canvas);
    c.imageSmoothingQuality = "high";
    c.drawImage(bitmap, 0, 0, width, height);
    return await toBlob(canvas, "image/jpeg", 0.85);
  } finally {
    bitmap.close();
  }
}

/** EXIF-corrected, long edge 1200-2400px, grayscale + contrast stretch, PNG. */
export async function prepareForTesseract(file: Blob): Promise<Blob> {
  const { canvas, c, width, height } = await drawFitted(file, 1200, 2400);
  const img = c.getImageData(0, 0, width, height);
  grayscale(img.data);
  contrastStretch(img.data);
  c.putImageData(img, 0, 0);
  return toBlob(canvas, "image/png");
}
