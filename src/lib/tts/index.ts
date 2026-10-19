import { Capacitor } from "@capacitor/core";
import { splitSentences } from "./sentences";

export { splitSentences };

export interface SpeakOptions {
  /** App ttsSpeed: 0.5 / 0.8 / 1.2 */
  rate?: number;
  lang?: string;
  onSentence?: (index: number) => void;
}

let speaking = false;
let session = 0; // bumped on every speak()/stop() so stale loops exit

const hasSynth = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function isTtsAvailable(): boolean {
  return Capacitor.isNativePlatform() || hasSynth();
}

export function isSpeaking(): boolean {
  return speaking;
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, 1500);
    synth.addEventListener("voiceschanged", done);
  });
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang = "en-US"): SpeechSynthesisVoice | null {
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  for (const want of ["en-ph", norm(lang), "en-us", "en-gb"]) {
    const v = voices.find((x) => norm(x.lang) === want);
    if (v) return v;
  }
  return voices.find((x) => norm(x.lang).startsWith("en")) ?? null;
}

function speakSentence(text: string, voice: SpeechSynthesisVoice | null, lang: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? lang;
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/** Speaks text; resolves when finished or stopped. */
export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const { rate = 1, lang = "en-US", onSentence } = opts;
  const sentences = splitSentences(text);
  if (!sentences.length || !isTtsAvailable()) return;
  await stop();
  const mine = ++session;
  speaking = true;
  try {
    if (Capacitor.isNativePlatform()) {
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      for (let i = 0; i < sentences.length && mine === session; i++) {
        onSentence?.(i);
        try {
          await TextToSpeech.speak({ text: sentences[i], lang, rate, pitch: 1, volume: 1, category: "playback" });
        } catch {
          break;
        }
      }
    } else {
      const voice = pickVoice(await loadVoices(), lang);
      for (let i = 0; i < sentences.length && mine === session; i++) {
        onSentence?.(i);
        await speakSentence(sentences[i], voice, lang, rate);
      }
    }
  } finally {
    if (mine === session) speaking = false;
  }
}

export async function stop(): Promise<void> {
  session++;
  speaking = false;
  if (hasSynth()) window.speechSynthesis.cancel();
  if (Capacitor.isNativePlatform()) {
    try {
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      await TextToSpeech.stop();
    } catch {
      /* nothing playing */
    }
  }
}
