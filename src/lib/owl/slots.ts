/**
 * Per-page 3D slot. Every live WebGL context is expensive on 2-3 GB phones, so by default ONE owl at a time runs
 * the 3D renderer; every other mounted Owl shows the SVG. Rules:
 *  - owls smaller than MIN_3D_SIZE never take the slot;
 *  - `priority: "hero"` owls are served first, then the oldest mounted owl;
 *  - when the owner unmounts (or scrolls away) the next-oldest eligible owl takes over automatically.
 * Registrations are keyed by a unique id returned from register(), so a StrictMode double mount just
 * unregisters one id and registers a fresh one.
 */
export const MIN_3D_SIZE = 72;

export interface SlotRequest {
  size: number;
  priority?: "hero";
}

interface Entry extends SlotRequest {
  id: number;
}

let entries: Entry[] = [];
let nextId = 1;
let limit = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function registerOwl(req: SlotRequest): { id: number; unregister: () => void } {
  const id = nextId++;
  entries.push({ id, ...req });
  emit();
  return {
    id,
    unregister() {
      const before = entries.length;
      entries = entries.filter((e) => e.id !== id);
      if (entries.length !== before) emit();
    },
  };
}

/** Ids currently entitled to run 3D, in priority order. */
export function slotOwners(): number[] {
  const eligible = entries.filter((e) => e.size >= MIN_3D_SIZE);
  const hero = eligible.filter((e) => e.priority === "hero");
  const rest = eligible.filter((e) => e.priority !== "hero");
  return [...hero, ...rest].slice(0, limit).map((e) => e.id);
}

export function isSlotOwner(id: number): boolean {
  return slotOwners().includes(id);
}

export function subscribeSlots(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Dev/QA only (the showcase raises it to review many owls at once). Default 1. */
export function setOwlSlotLimit(n: number): void {
  limit = Math.max(1, n);
  emit();
}

export function resetOwlSlots(): void {
  entries = [];
  nextId = 1;
  limit = 1;
  listeners.clear();
}
