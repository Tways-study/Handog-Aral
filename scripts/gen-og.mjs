// Renders the social-card images (src/app/opengraph-image.png and twitter-image.png, 1200x630).
// Usage: node scripts/gen-og.mjs   (needs network once for the Google Fonts CSS, and Playwright's Chromium;
// set PW_CHROMIUM_PATH to use an installed Chrome for Testing). Output is compressed with `sharp`.
// The brand look: ruled pad paper, an indigo notebook cover carrying the sunrise owl, wordmark in Baloo 2.
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const OWL = `
<path d="M22 36 L30 14 L44 30 Z" fill="#8A5A2B"/><path d="M98 36 L90 14 L76 30 Z" fill="#8A5A2B"/>
<path d="M60 22c-26 0-42 18-42 44 0 28 18 46 42 46s42-18 42-46c0-26-16-44-42-44z" fill="#A86B34"/>
<path d="M60 58c-16 0-26 12-26 28 0 16 11 24 26 24s26-8 26-24c0-16-10-28-26-28z" fill="#F2D3A0"/>
<path d="M46 74q4 3 8 0M66 74q4 3 8 0M44 86q4 3 8 0M58 88q4 3 8 0M70 84q4 3 8 0M52 98q4 3 8 0M64 98q4 3 8 0" stroke="#C99A5E" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<circle cx="44" cy="48" r="16" fill="#FFF8EA"/><circle cx="76" cy="48" r="16" fill="#FFF8EA"/>
<circle cx="45" cy="49" r="8" fill="#1D2340"/><circle cx="75" cy="49" r="8" fill="#1D2340"/>
<circle cx="48" cy="46" r="2.6" fill="#fff"/><circle cx="78" cy="46" r="2.6" fill="#fff"/>
<path d="M55 58 L60 68 L65 58 Z" fill="#F08A24"/>`;

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Atkinson+Hyperlegible:wght@400;700&display=block" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;position:relative;background:#FBF7EE;font-family:'Atkinson Hyperlegible',sans-serif;color:#1D2340;
    background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 53px,#C3D3EE 53px,#C3D3EE 55px)}
  .margin{position:absolute;left:520px;top:0;bottom:0;width:3px;background:#E0756C;opacity:.8}
  .cover{position:absolute;left:64px;top:64px;width:392px;height:502px;border-radius:14px 28px 28px 14px;background:#2B3A8C;box-shadow:0 18px 40px -16px rgba(29,35,64,.55)}
  .cover:before{content:"";position:absolute;left:26px;top:0;bottom:0;width:3px;background:rgba(255,255,255,.18)}
  .label{position:absolute;left:70px;right:46px;top:52px;height:96px;background:#FFFDF7;border-radius:10px;display:flex;align-items:center;justify-content:center;font:800 40px 'Baloo 2';color:#1D2340}
  .sun{position:absolute;left:84px;top:178px;width:290px;height:290px;border-radius:50%;background:#F08A24}
  svg{position:absolute;left:92px;top:196px;width:280px;height:280px}
  h1{position:absolute;left:580px;top:150px;font:800 132px/0.95 'Baloo 2';letter-spacing:-1px;color:#1D2340}
  .tag{position:absolute;left:584px;top:432px;font-size:35px;line-height:1.3;font-weight:700;color:#4A5070}
  .bar{position:absolute;left:584px;top:402px;width:96px;height:8px;border-radius:4px;background:#F08A24}
</style>
<div class="margin"></div>
<div class="cover"><div class="label">Handog Aral</div><div class="sun"></div><svg viewBox="0 0 120 120">${OWL}</svg></div>
<h1>Handog<br>Aral</h1><div class="bar"></div>
<div class="tag">Scan a page. Tap a word.<br>Understand it in your own language.</div>`;

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const shot = await page.screenshot({ type: "png" });
await browser.close();

const png = await sharp(shot).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
for (const name of ["opengraph-image.png", "twitter-image.png"]) await writeFile(join(root, "src", "app", name), png);
console.log(`wrote src/app/{opengraph,twitter}-image.png (${png.length} bytes)`);
