import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSlotOwner, registerOwl, resetOwlSlots, setOwlSlotLimit, subscribeSlots } from "./slots";

describe("owl 3D slot", () => {
  beforeEach(() => resetOwlSlots());

  it("gives the slot to the first mounted owl only", () => {
    const a = registerOwl({ size: 96 });
    const b = registerOwl({ size: 160 });
    expect(isSlotOwner(a.id)).toBe(true);
    expect(isSlotOwner(b.id)).toBe(false);
  });

  it("hands off to the next-oldest owl on unmount", () => {
    const a = registerOwl({ size: 96 });
    const b = registerOwl({ size: 96 });
    const c = registerOwl({ size: 96 });
    a.unregister();
    expect(isSlotOwner(b.id)).toBe(true);
    expect(isSlotOwner(c.id)).toBe(false);
  });

  it("serves a hero owl before older owls", () => {
    const a = registerOwl({ size: 96 });
    const hero = registerOwl({ size: 200, priority: "hero" });
    expect(isSlotOwner(hero.id)).toBe(true);
    expect(isSlotOwner(a.id)).toBe(false);
    hero.unregister();
    expect(isSlotOwner(a.id)).toBe(true);
  });

  it("never gives the slot to small owls", () => {
    const small = registerOwl({ size: 48 });
    const big = registerOwl({ size: 96 });
    expect(isSlotOwner(small.id)).toBe(false);
    expect(isSlotOwner(big.id)).toBe(true);
    big.unregister();
    expect(isSlotOwner(small.id)).toBe(false);
  });

  it("survives a StrictMode double mount without leaking", () => {
    const first = registerOwl({ size: 96 });
    first.unregister();
    first.unregister(); // idempotent
    const second = registerOwl({ size: 96 });
    expect(isSlotOwner(second.id)).toBe(true);
    const other = registerOwl({ size: 96 });
    expect(isSlotOwner(other.id)).toBe(false);
  });

  it("notifies subscribers and honours the dev limit", () => {
    const cb = vi.fn();
    subscribeSlots(cb);
    const a = registerOwl({ size: 96 });
    const b = registerOwl({ size: 96 });
    setOwlSlotLimit(2);
    expect(isSlotOwner(a.id) && isSlotOwner(b.id)).toBe(true);
    expect(cb).toHaveBeenCalledTimes(3);
  });
});
