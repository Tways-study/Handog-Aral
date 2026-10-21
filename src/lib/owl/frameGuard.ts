/** Averages the first N rendered frames; calls onSlow once if the mean frame time is above the limit. */
export interface FrameGuardOptions {
  sampleFrames?: number;
  maxAvgMs?: number;
  onSlow: (avgMs: number) => void;
}

export interface FrameGuard {
  record: (dtMs: number) => void;
  readonly done: boolean;
  readonly frames: number;
}

export function createFrameGuard({ sampleFrames = 40, maxAvgMs = 40, onSlow }: FrameGuardOptions): FrameGuard {
  let n = 0;
  let sum = 0;
  let done = false;
  return {
    record(dtMs) {
      if (done || !(dtMs > 0)) return;
      n++;
      sum += dtMs;
      if (n >= sampleFrames) {
        done = true;
        const avg = sum / n;
        if (avg > maxAvgMs) onSlow(avg);
      }
    },
    get done() {
      return done;
    },
    get frames() {
      return n;
    },
  };
}
