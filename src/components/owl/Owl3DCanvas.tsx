"use client";

import { useRef } from "react";
import type { OwlMood, OwlReaction } from "./Owl";
import type { OwlOutfit } from "@/stores/settings";
import { useOwlRenderer } from "./useOwlRenderer";

interface Props {
  size: number;
  mood: OwlMood;
  outfit: OwlOutfit;
  reaction?: OwlReaction;
  tapKey: number;
  interactive: boolean;
  onReady: () => void;
  onFail: () => void;
}

/** The lazy half of the owl: a transparent WebGL canvas. Only ever loaded through next/dynamic from Owl.tsx. */
export default function Owl3DCanvas(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useOwlRenderer(ref, props);
  return <canvas ref={ref} aria-hidden="true" className="block h-full w-full" />;
}
