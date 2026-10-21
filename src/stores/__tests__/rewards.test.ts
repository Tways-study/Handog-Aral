import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { useCelebrations } from "@/components/celebration/queue";
import { defaultProgress } from "../progress";
import { MAX_ALL_STARS, MAX_BONUS_STARS, selectAllStars, selectUnseen, useRewards } from "../rewards";

beforeEach(() => {
  useRewards.getState().reset();
  useCelebrations.getState().clear();
});

describe("recordEvent", () => {
  it("returns new ids, stores earned dates and queues one celebration each", () => {
    const ids = useRewards.getState().recordEvent({ type: "word-saved", total: 5, difficulty: "easy" });
    expect(ids).toEqual(["first-word", "five-words"]);
    expect(Object.keys(useRewards.getState().earned)).toEqual(ids);
    expect(typeof useRewards.getState().earned["first-word"]).toBe("number");
    expect(useCelebrations.getState().queue.map((q) => q.sticker)).toEqual(ids);
  });
  it("is idempotent on replay", () => {
    const e = { type: "scan-done" } as const;
    expect(useRewards.getState().recordEvent(e)).toEqual(["first-scan"]);
    expect(useRewards.getState().recordEvent(e)).toEqual([]);
    expect(useCelebrations.getState().queue).toHaveLength(1);
  });
  it("persists the one-time flags", () => {
    useRewards.getState().recordEvent({ type: "listen" });
    useRewards.getState().recordEvent({ type: "book-opened", bookId: "fox" });
    expect(useRewards.getState().flags).toMatchObject({ listened: true, openedBooks: ["fox"] });
  });
});

describe("award / markSeen / bonus", () => {
  it("award is idempotent", () => {
    expect(useRewards.getState().award("hard-word")).toBe(true);
    const at = useRewards.getState().earned["hard-word"];
    expect(useRewards.getState().award("hard-word")).toBe(false);
    expect(useRewards.getState().earned["hard-word"]).toBe(at);
  });
  it("tracks unseen stickers", () => {
    useRewards.getState().award("hard-word");
    expect(selectUnseen(useRewards.getState())).toEqual(["hard-word"]);
    useRewards.getState().markSeen("hard-word");
    useRewards.getState().markSeen("hard-word");
    expect(useRewards.getState().seen).toEqual(["hard-word"]);
    expect(selectUnseen(useRewards.getState())).toEqual([]);
  });
  it("caps bonus stars", () => {
    useRewards.getState().addBonusStars(99);
    expect(useRewards.getState().bonusStars).toBe(MAX_BONUS_STARS);
  });
});

describe("selectAllStars", () => {
  it("adds word, quiz and bonus stars, each capped", () => {
    const p = { ...defaultProgress, savedWordCount: 7, quizStars: 1 };
    expect(selectAllStars(p, { bonusStars: 2 })).toBe(2 + 1 + 2);
    expect(selectAllStars({ ...p, savedWordCount: 999, quizStars: 99 }, { bonusStars: 99 })).toBe(MAX_ALL_STARS);
  });
});

describe("persistence", () => {
  it("version 1 and migration keeps only valid data", async () => {
    const opts = useRewards.persist.getOptions();
    expect(opts.version).toBe(1);
    const migrated = opts.migrate!({ earned: { "first-word": 5, bogus: 7 }, seen: ["first-word", "nope"], bonusStars: 50 }, 0) as ReturnType<typeof useRewards.getState>;
    expect(migrated.earned).toEqual({ "first-word": 5 });
    expect(migrated.seen).toEqual(["first-word"]);
    expect(migrated.bonusStars).toBe(MAX_BONUS_STARS);
    expect(migrated.flags.openedBooks).toEqual([]);
    expect((opts.migrate!(undefined, 0) as ReturnType<typeof useRewards.getState>).earned).toEqual({});
  });
});
