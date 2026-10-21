import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));

interface FakeUtterance {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onboundary: ((e: { name: string; charIndex: number }) => void) | null;
}

const spoken: FakeUtterance[] = [];

beforeEach(() => {
  spoken.length = 0;
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      onend = null;
      onerror = null;
      onboundary = null;
      voice = null;
      lang = "";
      rate = 1;
      constructor(text: string) {
        this.text = text;
        spoken.push(this as unknown as FakeUtterance);
      }
    },
  );
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      getVoices: () => [{ lang: "en-US" }],
      addEventListener: () => {},
      removeEventListener: () => {},
      cancel: () => {},
      // finish each utterance on the next tick, after the test had a chance to fire boundaries
      speak: (u: FakeUtterance) => {
        queueMicrotask(() => {
          u.onboundary?.({ name: "word", charIndex: 0 });
          u.onboundary?.({ name: "word", charIndex: 4 });
          u.onboundary?.({ name: "sentence", charIndex: 0 });
          u.onend?.();
        });
      },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("speak word progress", () => {
  it("reports the global word ordinal from boundary events, across sentences", async () => {
    const { speak } = await import("./index");
    const words: number[] = [];
    const sentences: number[] = [];
    await speak("The fox ran. It was cold!", { onWord: (o) => words.push(o), onSentence: (i) => sentences.push(i) });
    expect(sentences).toEqual([0, 1]);
    // sentence 0: "The fox ran." -> charIndex 0 = word 0, charIndex 4 = word 1; sentence 1: "It was cold!" -> 3 + 0, 3 + 1
    expect(words).toEqual([0, 1, 3, 4]);
  });

  it("falls back to sentence progress when no onWord is given", async () => {
    const { speak } = await import("./index");
    const sentences: number[] = [];
    await speak("One two. Three four.", { onSentence: (i) => sentences.push(i) });
    expect(sentences).toEqual([0, 1]);
    expect(spoken.every((u) => u.onboundary === null)).toBe(true);
  });
});
