import { gsap } from "@/lib/motion";
import type { OwlMood, OwlReaction } from "./Owl";
import { NEUTRAL_POSE, type OwlPose } from "./owlModel";
import type { OwlOutfit } from "@/stores/settings";
import type { Group } from "three";

type Tween = gsap.core.Tween | gsap.core.Timeline;

export interface OwlMotionHost {
  /** Draws one frame. */
  render: () => void;
  applyPose: (p: OwlPose) => void;
  showOutfit: (o: OwlOutfit) => Group | null;
  /** Called after every rendered frame with the time since the previous tick (0 for the first of a burst). */
  onFrame?: (dtMs: number) => void;
}

/** What each mood holds as its resting pose. */
export function moodPose(mood: OwlMood): OwlPose {
  const p = { ...NEUTRAL_POSE };
  switch (mood) {
    case "cheer":
      Object.assign(p, { wingL: 2.45, wingR: 2.45, lidU: 1, arc: 1, beak: 1, glassesUp: 1 });
      break;
    case "think":
      Object.assign(p, { tilt: 0.17, lookX: 0.35, lookY: 0.6, pupX: 0.75, pupY: 0.8, wingRFwd: 1.45, wingR: -0.6, lidU: 0.12 });
      break;
    case "wave":
      Object.assign(p, { wingRFwd: 0.45, wingR: 1.95, beak: 0.25, tilt: -0.05 });
      break;
    case "sleep":
      Object.assign(p, { lidU: 1, arc: 1, arcFlip: 1, lean: 0.07, tilt: 0.08, glassesUp: 1 });
      break;
    default:
      break;
  }
  return p;
}

/**
 * Demand-driven animation: gsap tweens a plain pose object; a gsap.ticker listener renders ONLY while at least one
 * tween is running and removes itself afterwards, so the GPU is idle between reactions.
 */
export function createOwlMotion(host: OwlMotionHost) {
  const pose: OwlPose = { ...NEUTRAL_POSE };
  let mood: OwlMood = "idle";
  let base = moodPose("idle");
  const running = new Set<Tween>();
  let tickerOn = false;
  let skipDt = true;
  let paused = false;
  let destroyed = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let moodTween: Tween | undefined;
  let actionTween: Tween | undefined;
  let lookTween: Tween | undefined;

  const draw = () => {
    host.applyPose(pose);
    host.render();
  };

  const tick = (_t: number, dtMs: number) => {
    for (const t of running) if (!t.parent || t.totalProgress() >= 1) running.delete(t);
    draw();
    host.onFrame?.(skipDt ? 0 : dtMs);
    skipDt = false;
    if (running.size === 0) stopTicker();
  };
  const startTicker = () => {
    if (tickerOn || paused || destroyed) return;
    tickerOn = true;
    skipDt = true;
    gsap.ticker.add(tick);
  };
  const stopTicker = () => {
    if (!tickerOn) return;
    tickerOn = false;
    gsap.ticker.remove(tick);
  };

  const track = <T extends Tween>(t: T): T => {
    running.add(t);
    t.eventCallback("onComplete", () => running.delete(t));
    t.eventCallback("onInterrupt", () => running.delete(t));
    startTicker();
    return t;
  };
  const kill = (t: Tween | undefined) => {
    if (!t) return;
    t.kill();
    running.delete(t);
  };

  const timeline = (vars?: gsap.TimelineVars) => track(gsap.timeline(vars));

  // ----- action builders; each returns to `base` at the end -----
  const hopInto = (tl: gsap.core.Timeline, height = 0.55) => {
    tl.to(pose, { sy: 0.8, sx: 1.12, duration: 0.13, ease: "power2.out" })
      .to(pose, { sy: 1.1, sx: 0.93, hop: height, duration: 0.22, ease: "power2.out" })
      .to(pose, { hop: 0, sy: 1.02, sx: 0.99, duration: 0.2, ease: "power2.in" })
      .to(pose, { sy: 0.86, sx: 1.08, duration: 0.07, ease: "power1.out" })
      .to(pose, { sy: 1, sx: 1, duration: 0.5, ease: "elastic.out(1,0.5)" });
    return tl;
  };
  const wingsUpAndBack = (tl: gsap.core.Timeline, at: string | number) => {
    tl.to(pose, { wingL: 2.5, wingR: 2.5, duration: 0.25, ease: "back.out(2)" }, at).to(
      pose,
      { wingL: base.wingL, wingR: base.wingR, duration: 0.35, ease: "power2.inOut" },
      ">0.35",
    );
  };
  const waveWing = (tl: gsap.core.Timeline, times = 3) => {
    tl.to(pose, { wingRFwd: 0.45, wingR: 1.75, duration: 0.2, ease: "power2.out" });
    for (let i = 0; i < times; i++) {
      tl.to(pose, { wingR: 2.3, duration: 0.17, ease: "sine.inOut" }).to(pose, { wingR: 1.75, duration: 0.17, ease: "sine.inOut" });
    }
    tl.to(pose, { wingR: base.wingR, wingRFwd: base.wingRFwd, duration: 0.3, ease: "power2.inOut" });
    return tl;
  };

  const actions = {
    hop() {
      return hopInto(timeline());
    },
    cheer() {
      const tl = hopInto(timeline(), 0.62);
      tl.to(pose, { beak: 1, lidU: 1, arc: 1, glassesUp: 1, duration: 0.12, ease: "power2.out" }, 0.12);
      wingsUpAndBack(tl, 0.12);
      tl.to(pose, { beak: base.beak, lidU: base.lidU, arc: base.arc, glassesUp: base.glassesUp, duration: 0.2 }, ">0.2");
      return tl;
    },
    think() {
      const tl = timeline();
      tl.to(pose, { tilt: 0.2, lookX: 0.4, lookY: 0.7, pupX: 0.8, pupY: 0.85, wingRFwd: 1.45, wingR: -0.6, duration: 0.4, ease: "power2.out" })
        .to({}, { duration: 1.1 })
        .to(pose, {
          tilt: base.tilt, lookX: base.lookX, lookY: base.lookY, pupX: base.pupX, pupY: base.pupY,
          wingRFwd: base.wingRFwd, wingR: base.wingR, duration: 0.4, ease: "power2.inOut",
        });
      return tl;
    },
    wave() {
      const tl = timeline();
      waveWing(tl, 3);
      tl.to(pose, { tilt: -0.07, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0).to(pose, { tilt: base.tilt, duration: 0.15 });
      return tl;
    },
  };

  function playAction(kind: OwlReaction["kind"]) {
    if (destroyed) return;
    kill(actionTween);
    // snap held wing/eye channels a moving action will rewrite back to the resting pose first
    actionTween = actions[kind]();
  }

  function applyMood(next: OwlMood, immediate: boolean) {
    mood = next;
    base = moodPose(next);
    kill(moodTween);
    if (immediate) {
      Object.assign(pose, base);
      if (!paused) draw();
      return;
    }
    const tl = timeline();
    moodTween = tl;
    tl.to(pose, { ...base, duration: 0.4, ease: "power2.inOut", overwrite: "auto" });
    if (next === "cheer") hopInto(tl, 0.5);
    if (next === "wave") waveWing(tl, 3);
    if (next === "sleep") {
      tl.to(pose, { breathe: 1, duration: 1.4, ease: "sine.inOut", repeat: 11, yoyo: true });
    }
  }

  function setMood(next: OwlMood, immediate = false) {
    if (destroyed) return;
    const first = mood === next && !immediate;
    if (first) return;
    applyMood(next, immediate);
    if (immediate && next === "sleep") {
      // start the capped breathing loop (6 in/out cycles) even on mount
      moodTween = track(gsap.timeline()).to(pose, { breathe: 1, duration: 1.4, ease: "sine.inOut", repeat: 11, yoyo: true });
    }
    if (immediate && next === "wave") {
      moodTween = waveWing(timeline(), 3);
    }
  }

  // ----- idle life -----
  function blink() {
    const tl = timeline();
    tl.to(pose, { lidU: 1, lidL: Math.min(1, base.lidL + 0.15), duration: 0.07, ease: "power1.in" }).to(pose, {
      lidU: base.lidU, lidL: base.lidL, duration: 0.11, ease: "power1.out",
    });
  }
  function glance() {
    const s = Math.random() < 0.5 ? -1 : 1;
    const tl = timeline();
    tl.to(pose, { lookX: s * 0.55, pupX: s * 0.6, duration: 0.28, ease: "power2.out" })
      .to({}, { duration: 0.55 })
      .to(pose, { lookX: base.lookX, pupX: base.pupX, duration: 0.3, ease: "power2.inOut" });
  }
  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (paused || destroyed) return;
    idleTimer = setTimeout(() => {
      if (paused || destroyed) return;
      if (mood === "idle" || mood === "think" || mood === "wave") {
        if (mood === "idle" && Math.random() < 0.3) glance();
        blink();
      }
      scheduleIdle();
    }, 3000 + Math.random() * 3000);
  }

  return {
    setMood,
    react: playAction,
    /** Tap: a hop with a quick wing flap. */
    tap() {
      if (destroyed) return;
      kill(actionTween);
      const tl = hopInto(timeline());
      tl.to(pose, { wingL: 1.2, wingR: 1.2, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 3 }, 0.12).to(
        pose, { wingL: base.wingL, wingR: base.wingR, duration: 0.2 }, ">",
      );
      actionTween = tl;
    },
    /** Head follows the pointer: nx, ny in -1..1 (ny up is positive). null returns to the mood's resting gaze. */
    look(nx: number | null, ny = 0) {
      if (destroyed) return;
      kill(lookTween);
      const x = nx === null ? base.lookX : nx;
      const y = nx === null ? base.lookY : ny;
      lookTween = track(gsap.to(pose, { lookX: x, lookY: y, pupX: x * 0.9, pupY: y * 0.9, duration: 0.25, ease: "power2.out" }));
    },
    setOutfit(o: OwlOutfit, pop: boolean) {
      if (destroyed) return;
      const g = host.showOutfit(o);
      if (pop && g) {
        const tw = track(gsap.fromTo(g.scale, { x: 0.55, y: 0.55, z: 0.55 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: "back.out(3)" }));
        void tw;
      } else {
        draw();
      }
    },
    renderOnce() {
      draw();
    },
    /** Off-screen or tab hidden: stop rendering and idle timers. */
    setActive(active: boolean) {
      if (destroyed) return;
      if (active === !paused) return;
      paused = !active;
      if (paused) {
        clearTimeout(idleTimer);
        stopTicker();
      } else {
        draw();
        if (running.size) startTicker();
        scheduleIdle();
      }
    },
    startIdle: scheduleIdle,
    get busy() {
      return running.size > 0;
    },
    dispose() {
      destroyed = true;
      clearTimeout(idleTimer);
      stopTicker();
      running.forEach((t) => t.kill());
      running.clear();
      gsap.killTweensOf(pose);
    },
  };
}

export type OwlMotion = ReturnType<typeof createOwlMotion>;
