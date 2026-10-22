import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Parses the real tokens out of globals.css so the check can never drift from the shipped values.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function blocks(selector: string): Record<string, string> {
  const re = new RegExp(`^${selector.replace(".", "\\.")}\\s*\\{([\\s\\S]*?)^\\}`, "gm");
  const out: Record<string, string> = {};
  for (const m of css.matchAll(re)) {
    for (const d of m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  }
  return out;
}

const light = blocks(":root");
const dark = { ...light, ...blocks(".dark") };

function resolve(theme: Record<string, string>, name: string): string {
  let v = theme[name];
  if (v === undefined) throw new Error(`token ${name} not found`);
  for (let i = 0; i < 8; i++) {
    const m = v.match(/^var\((--[\w-]+)\)$/);
    if (!m) break;
    v = theme[m[1]];
  }
  return v;
}

type RGB = [number, number, number];
function hex(v: string): RGB {
  const m = v.match(/^#([0-9a-f]{6})$/i);
  if (!m) throw new Error(`not a 6-digit hex: ${v}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum([r, g, b]: RGB): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a: RGB, b: RGB): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function mix(tint: RGB, base: RGB, pct: number): RGB {
  return tint.map((c, i) => Math.round(c * pct + base[i] * (1 - pct))) as RGB;
}

const themes = { light, dark } as const;

// [foreground token, background token, min ratio, why]
const PAIRS: [string, string, number, string][] = [
  ["--ink", "--paper", 4.5, "body on paper"],
  ["--label-ink", "--label-paper", 4.5, "title on the notebook label (stays light in both themes)"],
  ["--label-ink-2", "--label-paper", 4.5, "caption on the notebook label (stays light in both themes)"],
  ["--ink", "--paper-2", 4.5, "body on paper-2"],
  ["--ink", "--card", 4.5, "body on card"],
  ["--ink", "--popover", 4.5, "body on popover"],
  ["--ink-2", "--paper", 4.5, "secondary on paper"],
  ["--ink-2", "--paper-2", 4.5, "secondary on paper-2"],
  ["--ink-2", "--card", 4.5, "secondary on card"],
  ["--muted-foreground", "--muted", 4.5, "muted text"],
  ["--ink", "--marker", 4.5, "tapped word"],
  ["--band-ink", "--band", 4.5, "page band title"],
  ["--band-ink-2", "--band", 4.5, "page band subtitle"],
  ["--primary-foreground", "--primary", 4.5, "sunrise button text"],
  ["--destructive-foreground", "--destructive", 4.5, "destructive button text"],
  ["--success-foreground", "--success", 4.5, "success fill text"],
  ["--warning-foreground", "--warning", 4.5, "warning fill text"],
  ["--indigo-fg", "--indigo", 4.5, "indigo jacket text"],
  ["--kangkong-fg", "--kangkong", 4.5, "kangkong jacket text"],
  ["--mango-fg", "--mango", 4.5, "mango jacket text"],
  ["--gumamela-fg", "--gumamela", 4.5, "gumamela jacket text"],
  ["--success", "--paper", 4.5, "success text on paper"],
  ["--warning-text", "--paper", 4.5, "warning text on paper"],
  ["--destructive-text", "--paper", 4.5, "error text on paper"],
  ["--destructive-text", "--card", 4.5, "error text on card"],
  // Non-text: stamps and focus ring and input borders need 3:1.
  ["--stamp-easy", "--paper", 3, "easy stamp"],
  ["--stamp-medium", "--paper", 3, "medium stamp"],
  ["--stamp-hard", "--paper", 3, "hard stamp"],
  ["--stamp-easy", "--paper-2", 3, "easy stamp on paper-2"],
  ["--stamp-medium", "--paper-2", 3, "medium stamp on paper-2"],
  ["--stamp-hard", "--paper-2", 3, "hard stamp on paper-2"],
  ["--ring", "--paper", 3, "focus ring on paper"],
  ["--ring", "--paper-2", 3, "focus ring on paper-2"],
  ["--ring", "--card", 3, "focus ring on card"],
  ["--input", "--paper", 3, "input border"],
  ["--input", "--card", 3, "input border on card"],
];

describe.each(Object.keys(themes) as (keyof typeof themes)[])("contrast (%s theme)", (name) => {
  const theme = themes[name];
  it.each(PAIRS)("%s on %s >= %s (%s)", (fg, bg, min) => {
    const r = ratio(hex(resolve(theme, fg)), hex(resolve(theme, bg)));
    expect(r, `${fg} on ${bg} = ${r.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });

  it("ink and ink-2 stay readable on every colour overlay", () => {
    const paper = hex(resolve(theme, "--paper"));
    for (const [tint, pct] of [
      ["--tint-yellow", 0.16],
      ["--tint-blue", 0.16],
      ["--tint-pink", 0.12],
    ] as const) {
      const bg = mix(hex(resolve(theme, tint)), paper, pct);
      expect(ratio(hex(resolve(theme, "--ink")), bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(hex(resolve(theme, "--ink-2")), bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("token integrity", () => {
  it("overlay mix percentages in the stylesheet match the test", () => {
    expect(css).toMatch(/overlay-yellow[^}]*16%/);
    expect(css).toMatch(/overlay-blue[^}]*16%/);
    expect(css).toMatch(/overlay-pink[^}]*12%/);
  });
  it("defines every jacket in both themes through :root", () => {
    for (const j of ["--indigo", "--kangkong", "--mango", "--gumamela"]) {
      expect(light[j]).toBeDefined();
      expect(dark[j]).toBeDefined();
    }
  });
});
