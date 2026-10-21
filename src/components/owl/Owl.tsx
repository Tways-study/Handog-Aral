"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Mascot from "@/components/Mascot";
import { cn } from "@/lib/utils";
import { gsap, motionAllowed } from "@/lib/motion";
import {
  getOwlCapabilityEpoch,
  owl3dAllowed,
  subscribeOwlCapability,
} from "@/lib/owl/capability";
import { isSlotOwner, registerOwl, subscribeSlots } from "@/lib/owl/slots";
import { useSettings, type OwlOutfit } from "@/stores/settings";

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
  /**
   * Only ONE owl per page runs the 3D renderer (WebGL contexts are costly on low-end phones); the rest stay SVG.
   * "hero" owls are served first; otherwise the first-mounted owl wins, and owls under 72 px never take it.
   */
  priority?: "hero";
  /** Pass a label only when the owl carries meaning; decorative (aria-hidden) by default. */
  title?: string;
}

// The heavy three.js module: its own chunk, fetched only when an Owl actually decides to go 3D.
const Owl3DCanvas = dynamic(() => import("./Owl3DCanvas"), { ssr: false });

/**
 * THE owl for every screen. Renders the flat SVG `Mascot` at once in a fixed size x size box, and only when the
 * device can afford it (setting on, WebGL, no reduced motion, no save-data, page visible, not failed this session,
 * on screen) lazily loads the procedural three.js owl and cross-fades to it when its first frame is ready.
 */
export default function Owl({
  mood = "idle",
  outfit,
  size = 96,
  className,
  interactive = false,
  onTap,
  reaction,
  priority,
  title,
}: OwlProps) {
  const savedOutfit = useSettings((s) => s.owlOutfit);
  const owl3d = useSettings((s) => s.owl3d);
  const finalOutfit = outfit ?? savedOutfit;
  // Re-evaluate when the session failure flag or the dev force-SVG switch changes.
  const epoch = useSyncExternalStore(subscribeOwlCapability, getOwlCapabilityEpoch, () => 0);

  const rootRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<HTMLSpanElement>(null);
  const [staticOk, setStaticOk] = useState(false);
  const [visible, setVisible] = useState(false);
  const [inView, setInView] = useState(false);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [tapKey, setTapKey] = useState(0);

  // Capability (client only). Reduced motion / save-data changes at runtime flip it off again.
  useEffect(() => {
    const check = () => {
      setStaticOk(owl3dAllowed({ owl3d, ignoreVisibility: true }));
      setVisible(document.visibilityState === "visible");
    };
    check();
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    mq?.addEventListener?.("change", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      mq?.removeEventListener?.("change", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [owl3d, epoch]);

  // On screen (with a little margin)?
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !staticOk || typeof IntersectionObserver === "undefined") {
      setInView(staticOk);
      return;
    }
    const io = new IntersectionObserver((entries) => setInView(entries.some((e) => e.isIntersecting)), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [staticOk]);

  // Register for the per-page 3D slot while this owl is eligible; the registry decides who actually gets it.
  const wants = staticOk && inView && (visible || slotId !== null);
  useEffect(() => {
    if (!wants) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- releasing the slot when the owl leaves the screen
      setSlotId(null);
      setReady(false);
      return;
    }
    const reg = registerOwl({ size, priority });
    setSlotId(reg.id);
    return () => {
      reg.unregister();
      setSlotId(null);
    };
  }, [wants, size, priority]);
  const slot = useSyncExternalStore(
    subscribeSlots,
    () => slotId !== null && isSlotOwner(slotId),
    () => false,
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- losing the slot returns this owl to the SVG
    if (!slot) setReady(false);
  }, [slot]);

  const handleFail = useCallback(() => {
    setSlotId(null);
    setReady(false);
  }, []);
  const handleReady = useCallback(() => setReady(true), []);

  const hopSvg = () => {
    const el = svgRef.current;
    if (!el || ready || !motionAllowed()) return;
    gsap.fromTo(
      el,
      { y: 0, scaleY: 1 },
      { keyframes: [{ scaleY: 0.88, duration: 0.1 }, { y: -size * 0.12, scaleY: 1.05, duration: 0.18 }, { y: 0, scaleY: 1, duration: 0.3, ease: "elastic.out(1,0.5)" }], clearProps: "transform" },
    );
  };

  // SVG fallback still reacts (a small hop) where motion is allowed.
  const reactionKey = reaction?.key;
  const firstReaction = useRef(reactionKey);
  useEffect(() => {
    if (firstReaction.current === reactionKey) return;
    firstReaction.current = reactionKey;
    hopSvg();
  });  

  const renderer = slot && ready ? "3d" : "svg";
  const box = { width: size, height: size };

  const inner = (
    <>
      <span
        ref={svgRef}
        className={cn("absolute inset-0 block origin-bottom", renderer === "3d" && "invisible")}
        style={{ transformOrigin: "50% 100%" }}
      >
        <Mascot mood={mood} outfit={finalOutfit} size={size} title={interactive ? undefined : title} />
      </span>
      {slot && (
        <span
          className="absolute inset-0 block transition-opacity duration-200 ease-out"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <Owl3DCanvas
            size={size}
            mood={mood}
            outfit={finalOutfit}
            reaction={reaction}
            tapKey={tapKey}
            interactive={interactive}
            onReady={handleReady}
            onFail={handleFail}
          />
        </span>
      )}
    </>
  );

  const common = {
    "data-owl-renderer": renderer,
    "data-owl-mood": mood,
    "data-owl-outfit": finalOutfit,
  };

  if (interactive) {
    return (
      <button
        ref={(el) => {
          rootRef.current = el;
        }}
        type="button"
        aria-label={title ?? "Owl"}
        onClick={() => {
          setTapKey((k) => k + 1);
          hopSvg();
          onTap?.();
        }}
        className={cn(
          "relative inline-block shrink-0 cursor-pointer rounded-full bg-transparent p-0 select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-ring",
          className,
        )}
        style={{ ...box, minWidth: 44, minHeight: 44 }}
        {...common}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      ref={(el) => {
        rootRef.current = el;
      }}
      className={cn("relative inline-block shrink-0 select-none", className)}
      style={box}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      {...common}
    >
      {inner}
    </span>
  );
}
