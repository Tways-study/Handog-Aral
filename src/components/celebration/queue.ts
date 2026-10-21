import { create } from "zustand";
import type { OwlMood } from "@/components/owl/Owl";
import type { StickerId } from "@/lib/stickers/ids";

/** One moment in the queue. Give a `sticker` (title and hint come from the child's language) or your own `title`/`body`. */
export interface CelebrationInput {
  sticker?: StickerId;
  title?: string;
  body?: string;
  owlMood?: OwlMood;
}

export interface CelebrationItem extends CelebrationInput {
  id: number;
}

interface QueueState {
  queue: CelebrationItem[];
  /** Drops the first item (the host calls this when the child closes the moment). */
  next: () => void;
  clear: () => void;
}

let counter = 0;

export const useCelebrations = create<QueueState>()((set) => ({
  queue: [],
  next: () => set((s) => ({ queue: s.queue.slice(1) })),
  clear: () => set({ queue: [] }),
}));

/** Queue a celebration. Several calls play one after another; nothing ever auto-advances. */
export function celebrate(input: CelebrationInput): void {
  if (!input.sticker && !input.title) return;
  useCelebrations.setState((s) => ({ queue: [...s.queue, { ...input, id: ++counter }] }));
}
