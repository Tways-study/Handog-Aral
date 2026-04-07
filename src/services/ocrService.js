import { extractTextFromImageWithGemini } from "./geminiService";

export async function extractTextFromImage(imageFile, onProgress) {
  // Try Gemini Vision first — far more accurate than Tesseract for book pages
  const geminiText = await extractTextFromImageWithGemini(imageFile, onProgress);
  if (geminiText) return geminiText;

  // Fallback to Tesseract.js when no Gemini API key is configured
  onProgress?.(5);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress?.(Math.round(m.progress * 100));
      } else if (m.status === "initialized api") {
        onProgress?.(5);
      } else if (m.status === "loaded language traineddata") {
        onProgress?.(10);
      }
    },
  });
  try {
    const { data } = await worker.recognize(imageFile);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
