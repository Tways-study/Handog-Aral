import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

let online = true;
vi.mock("next/navigation", () => ({ usePathname: () => "/settings" }));
vi.mock("@/hooks/useOnlineStatus", () => ({ useOnlineStatus: () => ({ online }) }));
vi.mock("@/lib/tts", () => ({ speak: vi.fn(async () => {}), stop: vi.fn(async () => {}) }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
const warm = vi.fn();
const status = vi.fn();
vi.mock("@/lib/ocr/tesseract", () => ({ warmOfflinePack: (...a: unknown[]) => warm(...a), offlinePackStatus: () => status() }));

import SettingsScreen from "./SettingsScreen";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { enqueue, getDb, countWords } from "@/stores/db";
import { learnWord } from "@/lib/vocabulary";
import { defaultSettings, useSettings } from "@/stores/settings";
import { useProgress } from "@/stores/progress";

beforeEach(async () => {
  online = true;
  warm.mockReset();
  status.mockReset().mockResolvedValue({ cached: false, bytes: 0, total: 10_485_760 });
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  useSettings.setState({ ...defaultSettings });
  useProgress.getState().resetAll();
  const db = getDb()!;
  await Promise.all([db.wordCache.clear(), db.words.clear(), db.lookupQueue.clear()]);
});
afterEach(cleanup);

describe("Settings controls write the stores", () => {
  it("writes name, language, size, dyslexia, overlay, speed and theme", async () => {
    render(<SettingsScreen />);
    fireEvent.change(screen.getByLabelText("Child's name"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("radio", { name: "Filipino" }));
    fireEvent.click(screen.getByRole("radio", { name: "Large" }));
    fireEvent.click(screen.getByRole("switch", { name: "Dyslexia-friendly font" }));
    fireEvent.click(screen.getByRole("radio", { name: "Blue" }));
    fireEvent.click(screen.getByRole("radio", { name: "Fast" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(useSettings.getState()).toMatchObject({
      childName: "Ana", language: "tagalog", fontSize: "large", dyslexiaFont: true, colorOverlay: "blue", ttsSpeed: 1.2, theme: "dark",
    });
    expect(screen.getByTestId("dyslexia-preview").getAttribute("data-dyslexic")).toBe("on");
    expect(screen.getByTestId("overlay-preview").className).toContain("overlay-blue");
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    expect(speak).toHaveBeenCalledWith(expect.any(String), { rate: 1.2 });
    await waitFor(() => expect(screen.getByTestId("pack-status")).toBeTruthy());
  });

  it("has no API-key UI", () => {
    render(<SettingsScreen />);
    expect(screen.queryByText(/api key/i)).toBeNull();
  });
});

describe("Offline pack", () => {
  it("downloads with progress, then toasts success", async () => {
    let finish!: () => void;
    warm.mockImplementation((onProgress: (p: number) => void) => {
      onProgress(0.4);
      return new Promise<void>((r) => (finish = r));
    });
    render(<SettingsScreen />);
    const btn = await screen.findByRole("button", { name: "Download offline pack" });
    fireEvent.click(btn);
    expect(await screen.findByRole("progressbar")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Downloading..." }) as HTMLButtonElement).disabled).toBe(true);
    finish();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("toasts an error when the download fails", async () => {
    warm.mockRejectedValue(new Error("x"));
    render(<SettingsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Download offline pack" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it("disables the button while offline and shows the downloaded state", async () => {
    online = false;
    render(<SettingsScreen />);
    expect((await screen.findByRole("button", { name: "Download offline pack" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("connection").textContent).toBe("Offline");
    cleanup();
    online = true;
    status.mockResolvedValue({ cached: true, bytes: 10_485_760, total: 10_485_760 });
    render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByTestId("pack-status").textContent).toMatch(/Downloaded \(10\.0 MB\)/));
  });

  it("shows the pending lookup count", async () => {
    await enqueue({ word: "owl", sentence: "", language: "hiligaynon" });
    render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByTestId("pending").textContent).toBe("1 word waiting"));
  });
});

describe("Reset all progress", () => {
  it("asks first, then clears words, progress and the queue but keeps settings", async () => {
    await learnWord({ word: "cat", translation: "iring", difficulty: "easy", phonetic: "", english: "pet", emoji: "", example: null, source: "ai", language: "hiligaynon" }, null);
    await enqueue({ word: "owl", sentence: "", language: "hiligaynon" });
    useProgress.getState().recordQuizResult(3, 5);
    useSettings.getState().setChildName("Ana");
    render(<SettingsScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
    expect(await screen.findByText("All saved words")).toBeTruthy();
    expect(await countWords()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete everything" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(await countWords()).toBe(0);
    expect(useProgress.getState()).toMatchObject({ quizStars: 0, quizHighScore: 0, savedWordCount: 0 });
    expect(useSettings.getState().childName).toBe("Ana");
  });
});
