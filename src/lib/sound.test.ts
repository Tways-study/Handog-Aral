import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/stores/settings";
import { MAX_GAIN, play, resetSoundForTests, SOUNDS, type SoundName } from "./sound";

function fakeAudio(state: "running" | "suspended" = "running") {
  const gains: { gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn>; linearRampToValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> } }[] = [];
  const created = { oscillators: 0, resume: vi.fn(() => Promise.resolve()), instances: 0 };
  class FakeCtx {
    state = state;
    currentTime = 0;
    destination = {};
    constructor() {
      created.instances++;
    }
    resume() {
      return created.resume();
    }
    createGain() {
      const g = { gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
      gains.push(g);
      return g;
    }
    createOscillator() {
      created.oscillators++;
      return { type: "sine", frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    }
  }
  vi.stubGlobal("AudioContext", FakeCtx);
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeCtx;
  return { created, gains };
}

beforeEach(() => {
  resetSoundForTests();
  useSettings.setState({ sound: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  useSettings.setState({ sound: false });
});

describe("sound", () => {
  it("is a no-op when sound is off and never creates a context", () => {
    const { created } = fakeAudio();
    useSettings.setState({ sound: false });
    expect(play("pop")).toBe(false);
    expect(created.instances).toBe(0);
  });
  it("does not throw and returns false when Web Audio is missing", () => {
    expect(play("chime")).toBe(false);
  });
  it("creates the context lazily, once, and schedules every sound", () => {
    const { created } = fakeAudio();
    expect(created.instances).toBe(0);
    for (const name of Object.keys(SOUNDS) as SoundName[]) expect(play(name)).toBe(true);
    expect(created.instances).toBe(1);
    expect(created.oscillators).toBe(Object.values(SOUNDS).flat().length);
  });
  it("resumes a suspended context (autoplay policy)", () => {
    const { created } = fakeAudio("suspended");
    play("pop");
    expect(created.resume).toHaveBeenCalled();
  });
  it("keeps the master gain gentle", () => {
    const { gains } = fakeAudio();
    play("stamp");
    expect(gains[0].gain.value).toBeLessThanOrEqual(0.15);
    expect(MAX_GAIN).toBeLessThanOrEqual(0.15);
    for (const note of Object.values(SOUNDS).flat()) expect(note.vol ?? 1).toBeLessThanOrEqual(1);
  });
});
