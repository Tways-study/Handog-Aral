/**
 * The phonetic line is shown only when it is real. The dictionary fallback fabricates `/<word>/`
 * when it has nothing better, and a saved entry may carry an empty string; neither is worth a line.
 */
export function realPhonetic(phonetic: string | null | undefined, word: string): string | null {
  const p = (phonetic ?? "").trim();
  if (!p) return null;
  const bare = p.replace(/^\/+|\/+$/g, "").trim().toLowerCase();
  if (!bare || bare === word.trim().toLowerCase()) return null;
  return p;
}

/** The English line, or null when there is nothing (never an empty paragraph). */
export function realEnglish(english: string | null | undefined): string | null {
  const e = (english ?? "").trim();
  return e || null;
}
