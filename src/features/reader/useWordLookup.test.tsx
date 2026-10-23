import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ResolvedExplanation } from "@/shared/schemas";

const pending = new Map<string, { resolve: (e: ResolvedExplanation) => void; signal?: AbortSignal }>();
vi.mock("@/lib/dictionary/explain", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dictionary/explain")>("@/lib/dictionary/explain");
  return {
    ...actual,
    explain: (input: { word: string }, opts: { signal?: AbortSignal }) =>
      new Promise((resolve, reject) => {
        pending.set(input.word, { resolve, signal: opts.signal });
        opts.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  };
});

import { closeDb, putCached } from "@/stores/db";
import { useWordLookup } from "./useWordLookup";

const entry = (word: string, source: ResolvedExplanation["source"] = "ai", translation = `${word} sa Filipino`): ResolvedExplanation => ({
  word,
  phonetic: `/${word}/`,
  english: `${word} in English`,
  translation,
  emoji: "",
  difficulty: "easy",
  example: null,
  source,
  language: "tagalog",
});

beforeEach(async () => {
  await closeDb();
  indexedDB.deleteDatabase("handog-aral");
});
afterEach(() => {
  cleanup();
  pending.clear();
});

describe("useWordLookup", () => {
  it("tap A then B shows only B, even when A resolves last", async () => {
    const { result } = renderHook(() => useWordLookup("tagalog"));
    act(() => void result.current.lookup("alpha", "alpha.", 0));
    act(() => void result.current.lookup("beta", "beta.", 2));
    expect(pending.get("alpha")!.signal?.aborted).toBe(true);
    await act(async () => pending.get("beta")!.resolve(entry("beta")));
    await act(async () => pending.get("alpha")!.resolve(entry("alpha")));
    expect(result.current.state?.entry?.word).toBe("beta");
    expect(result.current.state?.tokenIndex).toBe(2);
    expect(result.current.state?.pending).toBe(false);
  });

  it("is pending with no entry until the lookup resolves", () => {
    const { result } = renderHook(() => useWordLookup("tagalog"));
    act(() => void result.current.lookup("alpha", "", 0));
    expect(result.current.state).toMatchObject({ pending: true, entry: null, word: "alpha" });
  });

  it("swaps an offline entry in place when its cache row is upgraded", async () => {
    await putCached(entry("gamma", "offline", "Wala pa sang paathag."));
    const { result } = renderHook(() => useWordLookup("tagalog"));
    act(() => void result.current.lookup("gamma", "", 4));
    await act(async () => pending.get("gamma")!.resolve(entry("gamma", "offline", "Wala pa sang paathag.")));
    expect(result.current.state?.entry?.source).toBe("offline");
    await act(async () => {
      await putCached(entry("gamma", "ai", "Tunay nga kahulugan"));
    });
    await waitFor(() => expect(result.current.state?.entry?.source).toBe("ai"));
    expect(result.current.state?.entry?.translation).toBe("Tunay nga kahulugan");
    expect(result.current.state?.tokenIndex).toBe(4);
  });
});
