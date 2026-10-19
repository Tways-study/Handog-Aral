import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDateString, selectTotalStars, useProgress, wordStarsFor } from "../progress";

beforeEach(() => useProgress.getState().resetAll());
afterEach(() => vi.useRealTimers());

describe("stars", () => {
  it("derives word stars from count, capped at 5", () => {
    expect(wordStarsFor(2)).toBe(0);
    expect(wordStarsFor(7)).toBe(2);
    expect(wordStarsFor(100)).toBe(5);
  });
  it("does not overwrite quiz stars when words change", () => {
    const s = useProgress.getState();
    s.recordQuizResult(3, 5);
    s.setSavedWordCount(3);
    expect(selectTotalStars(useProgress.getState())).toBe(2);
    s.setSavedWordCount(0);
    expect(useProgress.getState().quizStars).toBe(1);
    expect(selectTotalStars(useProgress.getState())).toBe(1);
  });
  it("keeps the best quiz score and awards one star per completed quiz", () => {
    const s = useProgress.getState();
    s.recordQuizResult(4, 5);
    s.recordQuizResult(2, 5);
    expect(useProgress.getState()).toMatchObject({ quizHighScore: 4, quizStars: 2 });
  });
});

describe("updateStreak (local dates)", () => {
  it("uses the local date, not UTC", () => {
    vi.useFakeTimers();
    // Local time 00:30 on Mar 5 (UTC date may differ depending on TZ; local string must say 03-05)
    vi.setSystemTime(new Date(2025, 2, 5, 0, 30));
    expect(localDateString()).toBe("2025-03-05");
    useProgress.getState().updateStreak();
    expect(useProgress.getState()).toMatchObject({ streak: 1, lastActiveDate: "2025-03-05" });
  });
  it("increments on consecutive days, no-ops same day, resets after a gap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 5, 23, 50));
    useProgress.getState().updateStreak();
    useProgress.getState().updateStreak();
    expect(useProgress.getState().streak).toBe(1);
    vi.setSystemTime(new Date(2025, 2, 6, 0, 10));
    useProgress.getState().updateStreak();
    expect(useProgress.getState().streak).toBe(2);
    vi.setSystemTime(new Date(2025, 2, 9, 12, 0));
    useProgress.getState().updateStreak();
    expect(useProgress.getState().streak).toBe(1);
  });
  it("handles month boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 31, 20));
    useProgress.getState().updateStreak();
    vi.setSystemTime(new Date(2025, 1, 1, 8));
    useProgress.getState().updateStreak();
    expect(useProgress.getState().streak).toBe(2);
  });
});
