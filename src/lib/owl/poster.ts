/**
 * A still of the 3D owl, taken the first time it renders. Every page mounts its own Owl, which starts as the flat SVG and
 * only swaps to WebGL a moment later; that swap read as the owl "switching back to the old model" on every navigation.
 * With a poster the owl is the 3D one from the first paint (and from the first paint of the NEXT visit too, since it is
 * remembered), and the live canvas fades in over identical pixels. Posters are only shown where 3D is allowed at all.
 */

/** Bump when the 3D model, its palette or its camera changes, so stale stills are dropped. */
export const POSTER_VERSION = "1";
const PREFIX = `handog-owl-poster:${POSTER_VERSION}:`;
const INDEX_KEY = `handog-owl-poster-index:${POSTER_VERSION}`;
/** Stills kept in storage (idle plus a few outfits and moods); the oldest are dropped past this. */
export const POSTER_LIMIT = 6;

interface Poster {
  url: string;
  /** Pixel width and height of the still. */
  px: number;
}

const memory = new Map<string, Poster>();

const slot = (mood: string, outfit: string) => `${mood}:${outfit}`;

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** The best remembered still for this look that has enough pixels for `neededPx`, or null. Never throws. */
export function getOwlPoster(mood: string, outfit: string, neededPx: number): string | null {
  const key = slot(mood, outfit);
  let p = memory.get(key);
  if (!p) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      const parsed = raw ? (JSON.parse(raw) as Partial<Poster>) : null;
      if (parsed && typeof parsed.url === "string" && typeof parsed.px === "number") {
        p = { url: parsed.url, px: parsed.px };
        memory.set(key, p);
      }
    } catch {
      /* storage unavailable: no poster */
    }
  }
  // A still that would have to be enlarged by more than ~10% would look soft: fall back to the SVG instead.
  return p && p.px >= neededPx * 0.9 ? p.url : null;
}

/** Remembers a still unless a sharper one for the same look is already stored. Never throws. */
export function putOwlPoster(mood: string, outfit: string, url: string, px: number): void {
  if (!url.startsWith("data:image/") || url.length > 200_000) return;
  const key = slot(mood, outfit);
  const current = memory.get(key);
  if (current && current.px >= px) return;
  memory.set(key, { url, px });
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ url, px }));
    const index = readIndex().filter((k) => k !== key);
    index.push(key);
    while (index.length > POSTER_LIMIT) {
      const old = index.shift()!;
      localStorage.removeItem(PREFIX + old);
      memory.delete(old);
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    /* quota or private mode: the in-memory still still serves this session */
  }
}

/** Snapshots a WebGL canvas right after a render (the drawing buffer is only guaranteed in that same task). */
export function captureOwlPoster(canvas: HTMLCanvasElement, mood: string, outfit: string): void {
  try {
    const px = canvas.width;
    if (px < 96) return;
    putOwlPoster(mood, outfit, canvas.toDataURL("image/png"), px);
  } catch {
    /* tainted or lost context: skip */
  }
}

/** Test helper. */
export function resetOwlPosters(): void {
  memory.clear();
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("handog-owl-poster")) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
