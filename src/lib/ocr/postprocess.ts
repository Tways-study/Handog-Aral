/** Pure text cleanup for raw OCR output (Tesseract or AI). */

const LETTER = /\p{L}/u;

function isJunkLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const letters = [...t].filter((c) => LETTER.test(c)).length;
  const digits = (t.match(/\d/g) ?? []).length;
  if (letters === 0 && digits === 0) return true; // only symbols
  // Mostly non-letters (ignoring spaces), e.g. "|| ~ . _ i"
  const compact = t.replace(/\s/g, "").length;
  return letters + digits < compact * 0.5 && letters < 3;
}

export function cleanOcrText(raw: string): string {
  if (!raw) return "";
  let s = raw.replace(/\r\n?/g, "\n");

  // Normalize typography.
  s = s
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐‑‒–]/g, "-")
    .replace(/[—―]/g, " - ")
    .replace(/ /g, " ")
    .replace(/[​-‍﻿]/g, "");

  // Join words hyphenated across a line break ("enor-\nmous").
  s = s.replace(/(\p{L})-[ \t]*\n[ \t]*(\p{Ll})/gu, "$1$2");

  // Drop junk lines.
  s = s
    .split("\n")
    .filter((l) => !isJunkLine(l))
    .join("\n");

  // Paragraphs: blank-line separated; single newlines become spaces.
  const paragraphs = s
    .split(/\n[ \t]*\n+/)
    .map((p) =>
      p
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/ {1,}- {1,}/g, " - ")
        .trim(),
    )
    .filter(Boolean);

  return paragraphs.join("\n\n").trim();
}
