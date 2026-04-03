export async function extractTextFromImage(imageFile, onProgress) {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(imageFile, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });
  return data.text;
}
