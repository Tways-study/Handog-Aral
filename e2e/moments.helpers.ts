import { expect, type Page } from "@playwright/test";

/** The sticker celebration dialog (CelebrationHost). It is modal: while it is open the page is out of the accessibility tree. */
export const celebration = (page: Page) => page.getByTestId("celebration");

/**
 * Waits for a sticker celebration (the reader emits its events ~1.4 s after the stamp) and dismisses every queued one.
 * Returns how many it closed.
 */
export async function settleCelebrations(page: Page, timeout = 4000): Promise<number> {
  let closed = 0;
  const dialog = celebration(page);
  try {
    await dialog.waitFor({ state: "visible", timeout });
  } catch {
    return 0;
  }
  while (await dialog.isVisible()) {
    await dialog.getByRole("button").click();
    closed++;
    await page.waitForTimeout(350);
  }
  return closed;
}

/**
 * Replaces Web Speech with a fake that speaks slowly and fires `boundary` events per word (Chromium headless has no
 * voices). `window.__spoken` records every utterance text. Call before the page loads.
 */
export async function mockSpeechBoundary(page: Page, { wordMs = 140, boundaries = true }: { wordMs?: number; boundaries?: boolean } = {}) {
  await page.addInitScript(
    ({ wordMs, boundaries }) => {
      const w = window as unknown as Record<string, unknown>;
      w.__spoken = [] as string[];
      const timers = new Set<number>();
      class FakeUtterance {
        text: string;
        voice: unknown = null;
        lang = "";
        rate = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onboundary: ((e: { name: string; charIndex: number }) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }
      let current: FakeUtterance | null = null;
      const fake = {
        getVoices: () => [{ lang: "en-US", name: "Fake" }],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {
          timers.forEach((t) => clearTimeout(t));
          timers.clear();
          const u = current;
          current = null;
          u?.onend?.();
        },
        speak: (u: FakeUtterance) => {
          current = u;
          (w.__spoken as string[]).push(u.text);
          const starts = Array.from(u.text.matchAll(/\p{L}+(?:['’-]\p{L}+)*/gu), (m) => m.index ?? 0);
          starts.forEach((charIndex, i) => {
            if (!boundaries) return;
            timers.add(window.setTimeout(() => u.onboundary?.({ name: "word", charIndex }), (i + 1) * wordMs));
          });
          timers.add(
            window.setTimeout(() => {
              current = null;
              u.onend?.();
            }, (starts.length + 1) * wordMs),
          );
        },
      };
      Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
      (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = FakeUtterance;
    },
    { wordMs, boundaries },
  );
}

/** Records every `handog:pop-tab` the page dispatches into `window.__popTabs`. Call after the page loaded. */
export async function recordTabPops(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __popTabs: string[] };
    w.__popTabs = [];
    window.addEventListener("handog:pop-tab", (e) => w.__popTabs.push(String((e as CustomEvent).detail)));
  });
}

export const tabPops = (page: Page) => page.evaluate(() => (window as unknown as { __popTabs?: string[] }).__popTabs ?? []);

export async function expectInViewport(page: Page, box: { x: number; y: number; width: number; height: number } | null, label: string) {
  expect(box, `${label} has a box`).not.toBeNull();
  const vp = page.viewportSize()!;
  expect(box!.y, `${label} top`).toBeGreaterThanOrEqual(-1);
  expect(box!.y + box!.height, `${label} bottom`).toBeLessThanOrEqual(vp.height + 1);
  expect(box!.x + box!.width, `${label} right`).toBeLessThanOrEqual(vp.width + 1);
}
