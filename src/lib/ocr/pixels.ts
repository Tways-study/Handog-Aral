/** Pure pixel helpers operating on RGBA data (no DOM needed). */

export function grayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const y = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = y;
  }
}

/**
 * Percentile-based contrast stretch on an already-grayscale RGBA buffer:
 * maps the `low` percentile to 0 and the `high` percentile to 255.
 * No-op when the image is flat.
 */
export function contrastStretch(data: Uint8ClampedArray, low = 0.02, high = 0.98): void {
  const hist = new Uint32Array(256);
  const n = data.length / 4;
  if (n === 0) return;
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;
  let acc = 0;
  let lo = 0;
  let hi = 255;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= n * low) {
      lo = v;
      break;
    }
  }
  acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= n * high) {
      hi = v;
      break;
    }
  }
  if (hi - lo < 8) return;
  const scale = 255 / (hi - lo);
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = (v - lo) * scale;
  for (let i = 0; i < data.length; i += 4) {
    const y = lut[data[i]];
    data[i] = data[i + 1] = data[i + 2] = y;
  }
}

/** Scale so the long edge is clamped into [min, max]. Returns the (possibly unchanged) size. */
export function fitLongEdge(w: number, h: number, min: number, max: number): { width: number; height: number } {
  const long = Math.max(w, h);
  if (long === 0) return { width: w, height: h };
  const target = Math.min(max, Math.max(min, long));
  const k = target / long;
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}
