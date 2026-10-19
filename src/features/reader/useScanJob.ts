"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OcrError, recognizePage, type OcrErrorCode } from "@/lib/ocr/engine";

export type ScanStatus = "idle" | "scanning" | "done" | "error";

export interface ScanState {
  status: ScanStatus;
  /** 0..100, monotonic within one scan. */
  progress: number;
  text: string;
  source: "ai" | "offline" | null;
  error: OcrErrorCode | null;
}

const IDLE: ScanState = { status: "idle", progress: 0, text: "", source: null, error: null };

/** Runs OCR with a per-scan AbortController and id so a stale scan can never overwrite a newer one. */
export function useScanJob() {
  const [state, setState] = useState<ScanState>(IDLE);
  const idRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    idRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    setState(IDLE);
  }, []);

  const start = useCallback(async (file: Blob) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const id = ++idRef.current;
    setState({ ...IDLE, status: "scanning" });
    try {
      const res = await recognizePage(file, {
        signal: ctrl.signal,
        onProgress: (p) => {
          if (id !== idRef.current) return;
          const pct = Math.round(p * 100);
          setState((s) => (s.status === "scanning" && pct > s.progress ? { ...s, progress: pct } : s));
        },
      });
      if (id !== idRef.current) return;
      setState({ status: "done", progress: 100, text: res.text, source: res.source, error: null });
    } catch (err) {
      if (id !== idRef.current) return;
      const code: OcrErrorCode = err instanceof OcrError ? err.code : "failed";
      if (code === "aborted") {
        setState(IDLE);
        return;
      }
      setState({ ...IDLE, status: "error", error: code });
    }
  }, []);

  const reset = cancel;

  useEffect(
    () => () => {
      idRef.current++;
      abortRef.current?.abort();
    },
    [],
  );

  return { state, start, cancel, reset };
}
