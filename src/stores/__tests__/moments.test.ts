import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultProgress, useProgress } from "../progress";
import { useMoments } from "../moments";
import { useRewards } from "../rewards";

beforeEach(() => {
  useMoments.getState().reset();
  useProgress.setState({ ...defaultProgress });
  useRewards.getState().reset();
});

describe("useMoments", () => {
  it("claims a moment exactly once", () => {
    expect(useMoments.getState().pending("firstTap")).toBe(true);
    expect(useMoments.getState().claim("firstTap")).toBe(true);
    expect(useMoments.getState().claim("firstTap")).toBe(false);
    expect(useMoments.getState().pending("firstTap")).toBe(false);
    // other moments are independent
    expect(useMoments.getState().claim("firstSave")).toBe(true);
  });

  it("never gives a first time to a child who already has the history", () => {
    useProgress.setState({ savedWordCount: 4, quizStars: 1 });
    expect(useMoments.getState().claim("firstTap")).toBe(false);
    expect(useMoments.getState().claim("firstSave")).toBe(false);
    expect(useMoments.getState().claim("firstQuiz")).toBe(false);
    // the flag is still marked, so it stays false after the history goes away
    useProgress.setState({ ...defaultProgress });
    expect(useMoments.getState().claim("firstTap")).toBe(false);
  });

  it("scanRead stays quiet once a scan has been counted", () => {
    useRewards.getState().recordEvent({ type: "scan-done" }, { celebrate: false });
    expect(useMoments.getState().claim("scanRead")).toBe(false);
  });

  it("reset clears every flag", () => {
    useMoments.getState().claim("firstQuiz");
    useMoments.getState().reset();
    expect(useMoments.getState().firstQuiz).toBe(false);
  });
});
