import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  owl3dAllowed,
  resetOwlCapability,
  setOwlForceSvg,
  markOwl3dFailed,
} from "./capability";

function mockEnv({ reduced = false, saveData = false, webgl = true, hidden = false, effectiveType = "4g", memory = 4, cores = 8 } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((q: string) => ({ matches: reduced && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })),
  );
  Object.defineProperty(window, "matchMedia", { value: globalThis.matchMedia, configurable: true });
  Object.defineProperty(navigator, "connection", { value: { saveData, effectiveType }, configurable: true });
  Object.defineProperty(navigator, "deviceMemory", { value: memory, configurable: true });
  Object.defineProperty(navigator, "hardwareConcurrency", { value: cores, configurable: true });
  Object.defineProperty(document, "visibilityState", { value: hidden ? "hidden" : "visible", configurable: true });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
    webgl && (type === "webgl2" || type === "webgl") ? ({ getExtension: () => null } as unknown) : null) as never);
}

describe("owl3dAllowed", () => {
  beforeEach(() => resetOwlCapability());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("allows the happy path", () => {
    mockEnv();
    expect(owl3dAllowed({ owl3d: true })).toBe(true);
  });
  it("refuses when the setting is off", () => {
    mockEnv();
    expect(owl3dAllowed({ owl3d: false })).toBe(false);
  });
  it("refuses without WebGL", () => {
    mockEnv({ webgl: false });
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
  });
  it("refuses with reduced motion", () => {
    mockEnv({ reduced: true });
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
  });
  it("refuses with save-data", () => {
    mockEnv({ saveData: true });
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
  });
  it.each(["slow-2g", "2g", "3g"])("refuses on a %s connection", (effectiveType) => {
    mockEnv({ effectiveType });
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
  });
  it("refuses with 1 GB of memory or less", () => {
    mockEnv({ memory: 1 });
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
    mockEnv({ memory: 2 });
    expect(owl3dAllowed({ owl3d: true })).toBe(true);
  });
  it("refuses with two cores or fewer", () => {
    mockEnv({ cores: 2 });
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
    mockEnv({ cores: 4 });
    expect(owl3dAllowed({ owl3d: true })).toBe(true);
  });
  it("refuses while the page is hidden, unless visibility is ignored", () => {
    mockEnv({ hidden: true });
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
    expect(owl3dAllowed({ owl3d: true, ignoreVisibility: true })).toBe(true);
  });
  it("stays off for the session after a failure", () => {
    mockEnv();
    markOwl3dFailed();
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
  });
  it("honours the force-SVG switch", () => {
    mockEnv();
    setOwlForceSvg(true);
    expect(owl3dAllowed({ owl3d: true })).toBe(false);
    setOwlForceSvg(false);
    expect(owl3dAllowed({ owl3d: true })).toBe(true);
  });
});
