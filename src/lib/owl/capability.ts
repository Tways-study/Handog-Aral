/**
 * Decides whether the lazy 3D owl may load. Every rule here is cheap and synchronous so the SVG owl can
 * render immediately and three.js is only ever fetched when this returns true.
 */

export const OWL_FAIL_KEY = "handog-owl3d-failed";

let webglCache: boolean | null = null;
let forceSvg = false;
let epoch = 0;
const listeners = new Set<() => void>();

function bump(): void {
  epoch++;
  listeners.forEach((l) => l());
}

/** QA/dev escape hatch (the dev e2e renders through SwiftShader on purpose): localStorage "handog-owl3d-software" = "1". */
export const OWL_SOFTWARE_KEY = "handog-owl3d-software";

const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function softwareAllowed(): boolean {
  try {
    return localStorage.getItem(OWL_SOFTWARE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Try a throwaway canvas. The result is cached (a device does not gain WebGL mid-session).
 * A SOFTWARE renderer (SwiftShader, llvmpipe: what Chrome falls back to when the GPU is blocklisted, typically the
 * oldest phones) counts as "no WebGL": drawing the owl on the CPU would cost far more than the flat SVG is worth.
 */
export function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    let software = false;
    if (gl) {
      const info = gl.getExtension?.("WEBGL_debug_renderer_info");
      const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "") : "";
      software = SOFTWARE_GL.test(renderer) && !softwareAllowed();
    }
    webglCache = !!gl && !software;
    // Hand the context straight back so the probe does not eat into the browser's context budget.
    gl?.getExtension?.("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function saveDataOn(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !!conn?.saveData;
}

/**
 * Devices that should never pay for WebGL + three.js: slow or metered networks (the chunk alone is 139 KB gzipped),
 * 1 GB of RAM or less, or two cores or fewer. Every field is optional in the platform, so a missing value never refuses.
 */
export function lowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { connection?: { effectiveType?: string }; deviceMemory?: number };
  const type = nav.connection?.effectiveType;
  if (type === "slow-2g" || type === "2g" || type === "3g") return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 1) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) return true;
  return false;
}

export function hasOwl3dFailed(): boolean {
  try {
    return sessionStorage.getItem(OWL_FAIL_KEY) === "1";
  } catch {
    return false;
  }
}

/** Remember for the rest of the session that 3D did not work here (context lost, or too slow). */
export function markOwl3dFailed(): void {
  try {
    sessionStorage.setItem(OWL_FAIL_KEY, "1");
  } catch {
    /* private mode: the in-page teardown still happened */
  }
  bump();
}

/** Dev/QA switch (the showcase uses it). Not persisted. */
export function setOwlForceSvg(value: boolean): void {
  if (forceSvg === value) return;
  forceSvg = value;
  bump();
}

export interface CapabilityInput {
  /** The child's `owl3d` setting. */
  owl3d: boolean;
  /** Skip the page-visibility rule (used to decide whether an already-loaded owl may stay). */
  ignoreVisibility?: boolean;
  /**
   * Skip the WebGL probe. Creating even a throwaway GL context is a costly synchronous call on weak GPUs, so the
   * owl asks the cheap questions first and only probes once the load gate has opened.
   */
  skipWebGL?: boolean;
}

/** True when the 3D owl may be loaded: setting on, WebGL, no reduced motion, no save-data, not a low-end device, page visible, not failed. */
export function owl3dAllowed({ owl3d, ignoreVisibility = false, skipWebGL = false }: CapabilityInput): boolean {
  if (typeof window === "undefined") return false;
  if (!owl3d || forceSvg) return false;
  if (hasOwl3dFailed()) return false;
  if (prefersReducedMotion()) return false;
  if (saveDataOn()) return false;
  if (lowEndDevice()) return false;
  if (!ignoreVisibility && typeof document !== "undefined" && document.visibilityState === "hidden") return false;
  return skipWebGL || detectWebGL();
}

/** For useSyncExternalStore: changes whenever forceSvg or the failure flag changes. */
export function subscribeOwlCapability(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export function getOwlCapabilityEpoch(): number {
  return epoch;
}

/** Test helper. */
export function resetOwlCapability(): void {
  webglCache = null;
  forceSvg = false;
  epoch = 0;
  listeners.clear();
  try {
    sessionStorage.removeItem(OWL_FAIL_KEY);
  } catch {
    /* ignore */
  }
}
