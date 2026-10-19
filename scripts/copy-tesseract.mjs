// Copies the self-hosted Tesseract assets into public/tesseract/ so OCR works offline.
// Idempotent; never fails the install (exits 0 with a warning when something is missing).
import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "tesseract");
const nm = join(root, "node_modules");

// Same default tesseract.js 7 uses for the LSTM-only "best_int" English model.
const TRAINEDDATA_URL = "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz";

const FILES = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract-core-lstm.wasm.js"],
];

async function walk(dir, base = dir) {
  const res = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) res.push(...(await walk(p, base)));
    else if (e.name !== "manifest.json") res.push(relative(base, p).split("\\").join("/"));
  }
  return res;
}

async function main() {
  await mkdir(join(out, "lang"), { recursive: true });

  for (const [src, dest] of FILES) {
    const from = join(nm, src);
    const to = join(out, dest);
    if (existsSync(to)) continue;
    if (!existsSync(from)) {
      console.warn(`[copy-tesseract] WARNING: ${src} not found in node_modules; skipped.`);
      continue;
    }
    await copyFile(from, to);
  }

  const lang = join(out, "lang", "eng.traineddata.gz");
  if (!existsSync(lang)) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60_000);
      const res = await fetch(TRAINEDDATA_URL, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(lang, Buffer.from(await res.arrayBuffer()));
    } catch (err) {
      console.warn(
        `[copy-tesseract] WARNING: could not download eng.traineddata.gz (${err?.message ?? err}). ` +
          "Offline OCR will be unavailable until you re-run `node scripts/copy-tesseract.mjs` while online.",
      );
    }
  }

  const files = [];
  let total = 0;
  for (const path of (await walk(out)).sort()) {
    const { size } = await stat(join(out, path));
    files.push({ path, size });
    total += size;
  }
  await writeFile(join(out, "manifest.json"), JSON.stringify({ files, total }, null, 2));
  console.log(`[copy-tesseract] ${files.length} files, ${(total / 1024 / 1024).toFixed(1)} MB in public/tesseract/`);
}

main().catch((err) => {
  console.warn(`[copy-tesseract] WARNING: ${err?.message ?? err}`);
});
