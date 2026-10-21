"use client";

import Mascot from "@/components/Mascot";
import type { OwlOutfit } from "@/stores/settings";

export type OwlMood = "idle" | "cheer" | "think" | "wave" | "sleep";
export type { OwlOutfit };

/** A one-shot reaction: change `key` (any new number) to play `kind` once. Declarative, no refs needed. */
export interface OwlReaction {
  kind: "hop" | "cheer" | "think" | "wave";
  key: number;
}

export interface OwlProps {
  mood?: OwlMood;
  /** Defaults to the child's saved outfit from the settings store. */
  outfit?: OwlOutfit;
  /** CSS pixels. The owl keeps a 1:1 box so the layout never shifts when the 3D version loads. */
  size?: number;
  className?: string;
  /** When true the owl is a real button: tapping it plays a reaction and calls onTap. */
  interactive?: boolean;
  onTap?: () => void;
  reaction?: OwlReaction;
  /** Pass a label only when the owl carries meaning; decorative (aria-hidden) by default. */
  title?: string;
}

/**
 * THE owl for every screen. CONTRACT (fixed): the props above. PLACEHOLDER body: it renders the flat SVG
 * `Mascot` until the three.js track replaces it with the lazy 3D owl (same props, same 1:1 box, SVG
 * fallback for reduced motion / no WebGL / slow devices / the `owl3d` setting off).
 */
export default function Owl({ mood = "idle", outfit = "none", size = 96, className, title }: OwlProps) {
  return <Mascot mood={mood} outfit={outfit} size={size} className={className} title={title} />;
}
