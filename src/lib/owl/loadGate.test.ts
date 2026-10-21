import { describe, expect, it } from "vitest";
import { BUSY_LIMIT_MS, LOAD_SETTLE_MS, POSTPONE_MS, runGate, type GateEnv } from "./loadGate";

function fakeEnv(busy: (callIndex: number) => number) {
  const log: string[] = [];
  let t = 10_000;
  let calls = 0;
  const env: GateEnv = {
    now: () => t,
    busyMsSince: () => busy(calls++),
    whenLoaded: async () => void log.push("load"),
    whenIdle: async () => void log.push("idle"),
    wait: async (ms) => {
      log.push(`wait:${ms}`);
      t += ms;
    },
  };
  return { env, log };
}

describe("runGate", () => {
  it("waits for load, idle, then a settle delay before opening on a calm main thread", async () => {
    const { env, log } = fakeEnv(() => 0);
    await expect(runGate(env)).resolves.toBe(true);
    expect(log).toEqual(["load", "idle", `wait:${LOAD_SETTLE_MS}`]);
  });
  it("postpones once when the main thread was busy, then opens if it calmed down", async () => {
    const { env, log } = fakeEnv((i) => (i === 0 ? BUSY_LIMIT_MS + 1 : 20));
    await expect(runGate(env)).resolves.toBe(true);
    expect(log).toEqual(["load", "idle", `wait:${LOAD_SETTLE_MS}`, `wait:${POSTPONE_MS}`]);
  });
  it("skips 3D for the session when still busy after the postponement", async () => {
    const { env } = fakeEnv(() => 900);
    await expect(runGate(env)).resolves.toBe(false);
  });
  it("treats exactly the limit as calm", async () => {
    const { env } = fakeEnv(() => BUSY_LIMIT_MS);
    await expect(runGate(env)).resolves.toBe(true);
  });
});
