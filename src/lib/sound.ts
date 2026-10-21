import { useSettings } from "@/stores/settings";

/**
 * Tiny synthesized sound effects (Web Audio oscillators, no audio files, nothing to download).
 * Everything is a no-op unless the child turned sound on in Settings, and it fails silently when the
 * browser has no Web Audio or blocks it. Gentle on purpose: the master gain never exceeds MAX_GAIN.
 */
export type SoundName = "pop" | "stamp" | "chime" | "flip" | "whoosh" | "error-soft";

export const MAX_GAIN = 0.15;

interface Note {
  /** Hz at the start; `to` glides to it by the end of the note. */
  freq: number;
  to?: number;
  /** Seconds after the call. */
  at: number;
  dur: number;
  type?: OscillatorType;
  /** Fraction of MAX_GAIN, 0-1. */
  vol?: number;
}

export const SOUNDS: Record<SoundName, readonly Note[]> = {
  pop: [{ freq: 520, to: 880, at: 0, dur: 0.09, type: "sine", vol: 0.9 }],
  stamp: [
    { freq: 140, to: 70, at: 0, dur: 0.14, type: "triangle", vol: 1 },
    { freq: 300, to: 160, at: 0, dur: 0.06, type: "square", vol: 0.3 },
  ],
  chime: [
    { freq: 784, at: 0, dur: 0.18, type: "sine", vol: 0.8 },
    { freq: 1175, at: 0.09, dur: 0.28, type: "sine", vol: 0.7 },
  ],
  flip: [{ freq: 360, to: 520, at: 0, dur: 0.07, type: "triangle", vol: 0.6 }],
  whoosh: [{ freq: 300, to: 900, at: 0, dur: 0.2, type: "sawtooth", vol: 0.25 }],
  "error-soft": [{ freq: 330, to: 250, at: 0, dur: 0.16, type: "sine", vol: 0.6 }],
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MAX_GAIN;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

/** Plays a sound. Returns true when notes were scheduled (false when off, unsupported or blocked). */
export function play(name: SoundName): boolean {
  if (!useSettings.getState().sound) return false;
  // Created lazily, on the first call, which always comes from a tap (autoplay policy).
  const c = getContext();
  if (!c || !master) return false;
  try {
    if (c.state === "suspended") void c.resume().catch(() => {});
    const t0 = c.currentTime;
    for (const n of SOUNDS[name]) {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.setValueAtTime(n.freq, t0 + n.at);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.at + n.dur);
      const peak = Math.min(1, n.vol ?? 1);
      g.gain.setValueAtTime(0.0001, t0 + n.at);
      g.gain.linearRampToValueAtTime(peak, t0 + n.at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t0 + n.at);
      osc.stop(t0 + n.at + n.dur + 0.02);
    }
    return true;
  } catch {
    return false;
  }
}

/** Test hook: forget the AudioContext. */
export function resetSoundForTests(): void {
  ctx = null;
  master = null;
}
