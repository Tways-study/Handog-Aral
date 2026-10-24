import { useEffect, useRef, type RefObject } from "react";
import { WebGLRenderer } from "three";
import type { OwlMood, OwlReaction } from "./Owl";
import type { OwlOutfit } from "@/stores/settings";
import { buildOwl } from "./owlModel";
import { createOwlMotion, type OwlMotion } from "./owlMotion";
import { attachRendererGuard } from "@/lib/owl/rendererGuard";
import { captureOwlPoster } from "@/lib/owl/poster";
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

    // Start-up is split into short tasks (context, model, first frame) with a yield between each, so no single
    // long task blocks a tap or scroll on a slow phone. `torn` makes every stage safe to abandon.
    let torn = false;
    let renderer: WebGLRenderer | undefined;
    let model: ReturnType<typeof buildOwl> | undefined;
    let guard: ReturnType<typeof attachRendererGuard> | undefined;
    let motion: OwlMotion | undefined;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let lastMove = 0;
    let following = false;

    const teardown = () => {
      if (torn) return;
      torn = true;
      guard?.dispose();
      motion?.dispose();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      clearTimeout(leaveTimer);
      model?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      canvas.remove();
      rendererRef.current = null;
      motionRef.current = null;
    };
    const onVisibility = () => motion?.setActive(document.visibilityState === "visible");
    // Head follows the pointer while it is near the owl (interactive owls only, throttled).
    function onPointer(e: PointerEvent) {
      if (!o.current.interactive || !motion) return;
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
        motion?.look(null);
      }, 2200);
    }

    const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
    void (async () => {
      try {
        renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        teardown();
        o.current.onFail();
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(o.current.size, o.current.size, false);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;
      await tick();
      if (torn) return;
      const built = buildOwl();
      model = built;
      const r = renderer;
      // Compile the toon shaders off the main thread (KHR_parallel_shader_compile where the GPU has it), so the
      // first frame is a cheap draw instead of a long blocking link. Falls back to the plain path on any error.
      try {
        await r.compileAsync(built.scene, built.camera);
      } catch {
        await tick();
      }
      if (torn) return;
      guard = attachRendererGuard(canvas, {
        onFail: () => {
          teardown();
          o.current.onFail();
        },
      });
      motion = createOwlMotion({
        render: () => r.render(built.scene, built.camera),
        applyPose: built.applyPose,
        showOutfit: built.showOutfit,
        onFrame: (dt) => {
          recordOwlFrame(dt);
          if (dt > 0) guard?.recordFrame(dt);
        },
      });
      motionRef.current = motion;
      motion.setMood(o.current.mood, true);
      motion.setOutfit(o.current.outfit, false);
      motion.renderOnce();
      // Remember how this owl looks (same task as the render, while the drawing buffer is still valid).
      captureOwlPoster(canvas, o.current.mood, o.current.outfit);
      recordOwlFrame(0);
      o.current.onReady();

      document.addEventListener("visibilitychange", onVisibility);
      if (document.visibilityState === "visible") motion.startIdle();
      else motion.setActive(false);
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerdown", onPointer, { passive: true });
    })();

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
