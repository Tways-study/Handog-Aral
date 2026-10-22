// Renders the Android launcher icons (mipmap-*/ic_launcher*.png and the adaptive background colour) from the owl
// component, so they match the PWA icons. Usage: node scripts/gen-android-icons.mjs   (needs `sharp`).
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadArt } from "./lib/render-art.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const res = join(root, "android/app/src/main/res");
const { iconSvg, launcherForegroundSvg, ICON_PURPLE } = await loadArt(join(root, "src/components/art/brand.tsx"));

const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const png = (svg, px) => sharp(Buffer.from(svg), { density: 384 }).resize(px, px).png({ compressionLevel: 9 });

for (const [name, k] of Object.entries(DPI)) {
  const dir = join(res, `mipmap-${name}`);
  await png(iconSvg({ rounded: true }), Math.round(48 * k)).toFile(join(dir, "ic_launcher.png"));
  const circle = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50"/></svg>`);
  const sq = await png(iconSvg({ rounded: false }), Math.round(48 * k)).toBuffer();
  await sharp(sq).composite([{ input: await sharp(circle).resize(Math.round(48 * k)).toBuffer(), blend: "dest-in" }]).png().toFile(join(dir, "ic_launcher_round.png"));
  await png(launcherForegroundSvg(), Math.round(108 * k)).toFile(join(dir, "ic_launcher_foreground.png"));
}
await writeFile(
  join(res, "values/ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${ICON_PURPLE}</color>\n</resources>\n`,
);
console.log("android launcher icons written");
