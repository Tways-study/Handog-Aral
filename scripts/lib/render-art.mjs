// Bundles a TSX art entry with esbuild (a Next/Vite dependency, no install needed) and imports it, so the
// icon/OG scripts draw from the same React components as the app. Returns the entry module namespace.
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function loadArt(entry) {
  const dir = await mkdtemp(join(tmpdir(), "handog-art-"));
  const outfile = join(dir, "bundle.mjs");
  try {
    await build({
      entryPoints: [entry],
      bundle: true,
      format: "esm",
      platform: "node",
      outfile,
      jsx: "automatic",
      alias: { "@": join(root, "src") },
      nodePaths: [join(root, "node_modules")],
      banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
      logLevel: "error",
    });
    return await import(pathToFileURL(outfile).href);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
