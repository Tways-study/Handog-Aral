import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { get as idbGet, set as idbSet, clear as idbClear } from "idb-keyval";
import { createIdbStorage } from "../storage";
import { MIRROR_PREFIX } from "../bootMirror";

const NAME = "test-store";
const payload = (n: number) => JSON.stringify({ state: { n }, version: 1 });
const settle = () => new Promise((r) => setTimeout(r, 450)); // the idle reconcile runs on a 200 ms timer in jsdom

beforeEach(async () => {
  localStorage.clear();
  await idbClear();
});

describe("mirrored storage reconcile", () => {
  it("serves the mirror synchronously on the first read", async () => {
    localStorage.setItem(MIRROR_PREFIX + NAME, payload(7));
    const storage = createIdbStorage()!;
    const first = storage.getItem(NAME);
    expect(first).not.toBeInstanceOf(Promise);
    expect((first as { state: { n: number } }).state.n).toBe(7);
    await settle(); // let this instance's idle reconcile finish before the next test reuses the same storage
  });

  it("repairs IndexedDB, and does NOT roll back, when the mirror is newer (a write cut short by a reload)", async () => {
    await idbSet(NAME, payload(1));
    await idbSet(`${NAME}:ts`, "1000");
    localStorage.setItem(MIRROR_PREFIX + NAME, payload(2));
    localStorage.setItem(`${MIRROR_PREFIX}${NAME}:ts`, "2000");
    const onDrift = vi.fn();
    createIdbStorage(onDrift)!.getItem(NAME);
    await settle();
    expect(onDrift).not.toHaveBeenCalled();
    expect(await idbGet(NAME)).toBe(payload(2));
    expect(await idbGet(`${NAME}:ts`)).toBe("2000");
  });

  it("rehydrates from IndexedDB when IndexedDB is genuinely newer", async () => {
    await idbSet(NAME, payload(5));
    await idbSet(`${NAME}:ts`, "9000");
    localStorage.setItem(MIRROR_PREFIX + NAME, payload(4));
    localStorage.setItem(`${MIRROR_PREFIX}${NAME}:ts`, "3000");
    const onDrift = vi.fn();
    createIdbStorage(onDrift)!.getItem(NAME);
    await settle();
    expect(onDrift).toHaveBeenCalledWith(NAME);
    expect(await idbGet(NAME)).toBe(payload(5));
  });

  it("treats copies without timestamps (written before this fix) as IndexedDB-wins, like before", async () => {
    await idbSet(NAME, payload(5));
    localStorage.setItem(MIRROR_PREFIX + NAME, payload(4));
    const onDrift = vi.fn();
    createIdbStorage(onDrift)!.getItem(NAME);
    await settle();
    expect(onDrift).toHaveBeenCalledWith(NAME);
  });

  it("does nothing when both copies agree", async () => {
    await idbSet(NAME, payload(3));
    localStorage.setItem(MIRROR_PREFIX + NAME, payload(3));
    const onDrift = vi.fn();
    createIdbStorage(onDrift)!.getItem(NAME);
    await settle();
    expect(onDrift).not.toHaveBeenCalled();
  });

  it("a write stamps both copies with the same timestamp", async () => {
    const storage = createIdbStorage()!;
    await storage.setItem(NAME, { state: { n: 9 }, version: 1 });
    const mirrorTs = localStorage.getItem(`${MIRROR_PREFIX}${NAME}:ts`);
    expect(mirrorTs).toBeTruthy();
    expect(await idbGet(`${NAME}:ts`)).toBe(mirrorTs);
    expect(JSON.parse((await idbGet(NAME)) as string).state.n).toBe(9);
  });

  it("removing clears the value and its timestamp in both places", async () => {
    const storage = createIdbStorage()!;
    await storage.setItem(NAME, { state: { n: 1 }, version: 1 });
    await storage.removeItem(NAME);
    expect(localStorage.getItem(MIRROR_PREFIX + NAME)).toBeNull();
    expect(localStorage.getItem(`${MIRROR_PREFIX}${NAME}:ts`)).toBeNull();
    expect(await idbGet(NAME)).toBeUndefined();
    expect(await idbGet(`${NAME}:ts`)).toBeUndefined();
  });
});
