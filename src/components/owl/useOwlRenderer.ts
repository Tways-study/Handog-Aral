import { useEffect, useRef, type RefObject } from "react";
import { WebGLRenderer } from "three";
import type { OwlMood, OwlReaction } from "./Owl";
import type { OwlOutfit } from "@/stores/settings";
import { buildOwl } from "./owlModel";
import { createOwlMotion, type OwlMotion } from "./owlMotion";
import { attachRendererGuard } from "@/lib/owl/rendererGuard";
import { recordOwlFrame } from "@/lib/owl/stats";

export interface UseOwlRendererOptions {
  size: number;
  mood: OwlMood;
  outfit: OwlOutfit;
  reaction?: OwlReaction;
  /** Increments on each tap of an interactive owl. */
  tapKey: number;
  interactive: boolean;
  onReady: () => void;
  onFail: () => void;
}

/** Owns the WebGLRenderer, scene and motion controller for one canvas. Everything is released on unmount. */
export function useOwlRenderer(hostRef: RefObject<HTMLDivElement | null>, opts: UseOwlRendererOptions) {
  const o = useRef(opts);
  useEffect(() => {
    o.current = opts;
  });
  const motionRef = useRef<OwlMotion | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const prev = useRef({ outfit: opts.outfit, mood: opts.mood, reaction: opts.reaction?.key, tap: opts.tapKey });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // A fresh canvas per mount: a context that was force-lost (StrictMode remount) can never be reused.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(canvas);
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      canvas.remove();
      o.current.onFail();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(o.current.size, o.current.size, false);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    const model = buildOwl();

    let torn = false;
    const teardown = () => {
      if (torn) return;
      torn = true;
      guard.dispose();
      motion.dispose();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      clearTimeout(leaveTimer);
      model.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      rendererRef.current = null;
      motionRef.current = null;
    };

    const guard = attachRendererGuard(canvas, {
      onFail: () => {
        teardown();
        o.current.onFail();
      },
    });

    const motion = createOwlMotion({
      render: () => renderer.render(model.scene, model.camera),
      applyPose: model.applyPose,
      showOutfit: model.showOutfit,
      onFrame: (dt) => {
        recordOwlFrame(dt);
        if (dt > 0) guard.recordFrame(dt);
      },
    });
    motionRef.current = motion;
    motion.setMood(o.current.mood, true);
    motion.setOutfit(o.current.outfit, false);
    motion.renderOnce();
    recordOwlFrame(0);
    o.current.onReady();

    const onVisibility = () => motion.setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    if (document.visibilityState === "visible") motion.startIdle();
    else motion.setActive(false);

    // Head follows the pointer while it is near the owl (interactive owls only, throttled).
    let lastMove = 0;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let following = false;
    function onPointer(e: PointerEvent) {
      if (!o.current.interactive) return;
      const now = performance.now();
      if (e.type === "pointermove" && now - lastMove < 60) return;
      lastMove = now;
      const r = canvas.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width * 1.5);
      const dy = (cy - e.clientY) / (r.height * 1.5);
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        if (following) {
          following = false;
          motion.look(null);
        }
        return;
      }
      following = true;
      motion.look(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, dy)));
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        following = false;
        motion.look(null);
      }, 2200);
    }
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });

    return teardown;
  }, [hostRef]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.setSize(opts.size, opts.size, false);
    motionRef.current?.renderOnce();
  }, [opts.size]);

  useEffect(() => {
    if (prev.current.mood !== opts.mood) motionRef.current?.setMood(opts.mood);
    prev.current.mood = opts.mood;
  }, [opts.mood]);

  useEffect(() => {
    if (prev.current.outfit !== opts.outfit) motionRef.current?.setOutfit(opts.outfit, true);
    prev.current.outfit = opts.outfit;
  }, [opts.outfit]);

  const rk = opts.reaction?.key;
  useEffect(() => {
    if (prev.current.reaction !== rk && o.current.reaction) motionRef.current?.react(o.current.reaction.kind);
    prev.current.reaction = rk;
  }, [rk]);

  useEffect(() => {
    if (prev.current.tap !== opts.tapKey) motionRef.current?.tap();
    prev.current.tap = opts.tapKey;
  }, [opts.tapKey]);
}
