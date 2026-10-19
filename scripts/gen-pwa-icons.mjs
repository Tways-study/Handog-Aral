// Renders the PWA icons from the owl artwork (same shapes as src/components/Mascot.tsx).
// Usage: node scripts/gen-pwa-icons.mjs   (needs `sharp`, which ships with Next.js)
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
await mkdir(join(out, "icons"), { recursive: true });

const OWL = `
<path d="M22 36 L30 14 L44 30 Z" fill="#8A5A2B"/><path d="M98 36 L90 14 L76 30 Z" fill="#8A5A2B"/>
<path d="M60 22c-26 0-42 18-42 44 0 28 18 46 42 46s42-18 42-46c0-26-16-44-42-44z" fill="#A86B34"/>
<path d="M60 58c-16 0-26 12-26 28 0 16 11 24 26 24s26-8 26-24c0-16-10-28-26-28z" fill="#F2D3A0"/>
<path d="M46 74q4 3 8 0M66 74q4 3 8 0M44 86q4 3 8 0M58 88q4 3 8 0M70 84q4 3 8 0M52 98q4 3 8 0M64 98q4 3 8 0" stroke="#C99A5E" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<circle cx="44" cy="48" r="16" fill="#FFF8EA"/><circle cx="76" cy="48" r="16" fill="#FFF8EA"/>
<circle cx="45" cy="49" r="8" fill="#1D2340"/><circle cx="75" cy="49" r="8" fill="#1D2340"/>
<circle cx="48" cy="46" r="2.6" fill="#fff"/><circle cx="78" cy="46" r="2.6" fill="#fff"/>
<path d="M55 58 L60 68 L65 58 Z" fill="#F08A24"/>
<path d="M20 70c-6 10-4 26 6 34 2-12 6-22 10-28z" fill="#8A5A2B"/><path d="M100 70c6 10 4 26-6 34-2-12-6-22-10-28z" fill="#8A5A2B"/>`;

// 512 canvas. Sun and owl sit inside the 80% maskable safe zone (a circle of radius 205 about the centre).
function art({ rounded }) {
  const bg = rounded
    ? `<rect width="512" height="512" rx="112" fill="#FBF7EE"/>`
    : `<rect width="512" height="512" fill="#FBF7EE"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}
<circle cx="256" cy="262" r="176" fill="#F08A24"/>
<g transform="translate(106 96) scale(2.5)">${OWL}</g></svg>`;
}

const render = (svg, size, file) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toFile(join(out, "icons", file));

await render(art({ rounded: true }), 192, "icon-192.png");
await render(art({ rounded: true }), 512, "icon-512.png");
await render(art({ rounded: false }), 512, "maskable-512.png");
await render(art({ rounded: false }), 180, "apple-touch-icon.png");
await render(art({ rounded: true }), 48, "favicon-48.png");
await writeFile(join(out, "favicon.svg"), art({ rounded: true }).replace(' viewBox="0 0 512 512"', ' viewBox="0 0 512 512" width="512" height="512"'));
console.log("icons written to public/icons and public/favicon.svg");
