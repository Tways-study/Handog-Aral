// Renders the PWA icons and favicon from the owl component (src/components/art/OwlGroup.tsx), bundled with esbuild.
// Usage: node scripts/gen-pwa-icons.mjs   (needs `sharp`, which ships with Next.js; esbuild ships with Vite/Vitest)
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadArt } from "./lib/render-art.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");
await mkdir(join(out, "icons"), { recursive: true });

const { iconSvg } = await loadArt(join(root, "src/components/art/brand.tsx"));

const render = (svg, size, file) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toFile(join(out, "icons", file));

await render(iconSvg({ rounded: true }), 192, "icon-192.png");
await render(iconSvg({ rounded: true }), 512, "icon-512.png");
await render(iconSvg({ rounded: false }), 512, "maskable-512.png");
await render(iconSvg({ rounded: false }), 180, "apple-touch-icon.png");
await render(iconSvg({ rounded: true }), 48, "favicon-48.png");
await writeFile(join(out, "favicon.svg"), iconSvg({ rounded: true }) + "\n");
console.log("icons written to public/icons and public/favicon.svg");
