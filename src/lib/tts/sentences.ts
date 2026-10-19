/** Split text into sentences on . ! ? (and ellipsis), keeping closing quotes/brackets attached. Pure. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  const re = /[^.!?…]+(?:[.!?…]+["')\]”’]*|$)/g;
  for (const m of text.replace(/\s+/g, " ").trim().matchAll(re)) {
    const s = m[0].trim();
    if (s) out.push(s);
  }
  return out;
}
