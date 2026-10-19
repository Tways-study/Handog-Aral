"use client";

import type { ResolvedExplanation } from "@/shared/schemas";

/**
 * Presentational word explanation, shared by the reader (drawer on mobile, docked panel at lg+)
 * and the vocabulary list. It owns no data fetching and no container: callers wrap it in a
 * Drawer / docked column.
 *
 * PLACEHOLDER body: the Phase 4 reader agent replaces the markup with the designed version.
 * The props are the contract and must not change.
 */
export interface WordPanelProps {
  entry: ResolvedExplanation;
  /** Whether the word is in the child's saved vocabulary. */
  saved: boolean;
  onSave: () => void;
  onRemove: () => void;
  onSpeak: () => void;
  speaking?: boolean;
  /** True while a better explanation is being fetched; the layout must not shift when it arrives. */
  pending?: boolean;
}

export default function WordPanel({ entry, saved, onSave, onRemove, onSpeak }: WordPanelProps) {
  return (
    <div>
      <h2>{entry.word}</h2>
      <p>{entry.translation}</p>
      <p>{entry.english}</p>
      <button type="button" onClick={onSpeak}>Listen</button>
      <button type="button" onClick={saved ? onRemove : onSave}>{saved ? "Remove" : "Save"}</button>
    </div>
  );
}
