/**
 * Normalizes a tapped word: lowercase, curly apostrophes to straight, surrounding punctuation stripped,
 * internal apostrophes/hyphens and accented letters kept. Returns "" when nothing usable remains.
 */
export function normalizeWord(raw: string): string {
  return raw
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "")
    .trim();
}
