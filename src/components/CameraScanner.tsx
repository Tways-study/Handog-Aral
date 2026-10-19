"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, SwitchCamera, X } from "lucide-react";
import Mascot from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";

interface CameraScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type CameraError = "permission" | "notfound" | "insecure" | "generic";
type Facing = "environment" | "user";

/** The on-screen guide: 80% of the video width, 4:3, centred. */
export const GUIDE_WIDTH_RATIO = 0.8;
export const GUIDE_ASPECT = 4 / 3;

/**
 * Maps the on-screen guide box to source-pixel coordinates of the video frame, accounting for
 * object-cover (the video fills the container and is centred, so edges are cropped).
 */
export function computeGuideCrop(nativeW: number, nativeH: number, cW: number, cH: number) {
  const scale = Math.max(cW / nativeW, cH / nativeH);
  const oX = (cW - nativeW * scale) / 2;
  const oY = (cH - nativeH * scale) / 2;
  const guideW = cW * GUIDE_WIDTH_RATIO;
  const guideH = guideW / GUIDE_ASPECT;
  const guideLeft = (cW - guideW) / 2;
  const guideTop = (cH - guideH) / 2;
  const srcX = Math.max(0, Math.round((guideLeft - oX) / scale));
  const srcY = Math.max(0, Math.round((guideTop - oY) / scale));
  const srcW = Math.min(Math.round(guideW / scale), nativeW - srcX);
  const srcH = Math.min(Math.round(guideH / scale), nativeH - srcY);
  return { srcX, srcY, srcW, srcH };
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

export default function CameraScanner({ onCapture, onClose }: CameraScannerProps) {
  const t = useT();
  const s = t.scan;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState<CameraError | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<Facing>("environment");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    stopStream(streamRef.current);
    streamRef.current = null;

    const fail = (e: CameraError) => {
      if (!cancelled) {
        setReady(false);
        setError(e);
      }
    };

    async function start() {
      setReady(false);
      setError(null);
      if (typeof window !== "undefined" && window.isSecureContext === false) return fail("insecure");
      if (!navigator.mediaDevices?.getUserMedia) return fail(window.isSecureContext ? "notfound" : "insecure");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        // The promise can resolve after unmount or a flip: never leave the camera running.
        if (cancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            if (!cancelled) setReady(true);
          };
        }
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") fail("permission");
        else if (name === "NotFoundError" || name === "DevicesNotFoundError") fail("notfound");
        else fail("generic");
      }
    }
    void start();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [facing, attempt]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const rect = video.getBoundingClientRect();
    const { srcX, srcY, srcW, srcH } = computeGuideCrop(video.videoWidth, video.videoHeight, rect.width, rect.height);
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream(streamRef.current);
        streamRef.current = null;
        onCapture(new File([blob], "scan.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture]);

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    stopStream(streamRef.current);
    streamRef.current = null;
    onCapture(file);
  };

  const close = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    onClose();
  };

  const errorCopy: Record<CameraError, { title: string; body: string }> = {
    permission: { title: s.cameraPermissionTitle, body: s.cameraPermissionBody },
    notfound: { title: s.cameraNotFoundTitle, body: s.cameraNotFoundBody },
    insecure: { title: s.cameraInsecureTitle, body: s.cameraInsecureBody },
    generic: { title: s.cameraGenericTitle, body: s.cameraGenericBody },
  };

  const fileInput = <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickFile} tabIndex={-1} />;

  return (
    <div role="dialog" aria-modal="true" aria-label={s.title} className="fixed inset-0 z-[60] flex flex-col bg-ink text-paper">
      <canvas ref={canvasRef} className="hidden" />
      {fileInput}

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center" role="alert">
          <Mascot mood="think" size={72} />
          <h2 className="font-heading text-2xl font-bold">{errorCopy[error].title}</h2>
          <p className="max-w-sm text-base text-paper/80">{errorCopy[error].body}</p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button type="button" size="lg" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus aria-hidden="true" />
              {s.pickGallery}
            </Button>
            {(error === "generic" || error === "permission") && (
              <Button type="button" size="lg" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
                {s.cameraRetry}
              </Button>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" className="text-paper hover:bg-paper/10" onClick={close}>
            {s.cancel}
          </Button>
        </div>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="relative w-[80%] shadow-[0_0_0_100vmax_rgb(0_0_0/0.45)]" style={{ aspectRatio: "4 / 3" }}>
                <svg className="absolute inset-0 size-full text-sunrise" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true">
                  <path
                    d="M0 14V4a4 4 0 0 1 4-4h10M86 0h10a4 4 0 0 1 4 4v10M100 86v10a4 4 0 0 1-4 4H86M14 100H4a4 4 0 0 1-4-4V86"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
              <Button type="button" size="icon" variant="ink" className="bg-ink/85 text-paper" onClick={close} aria-label={s.cameraClose}>
                <X aria-hidden="true" />
              </Button>
              <p className="min-w-0 flex-1 rounded-full bg-ink/85 px-3 py-1.5 text-center text-sm font-bold">{s.cameraGuide}</p>
              <Button
                type="button"
                size="icon"
                variant="ink"
                className="bg-ink/85 text-paper"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                aria-label={s.cameraFlip}
              >
                <SwitchCamera aria-hidden="true" />
              </Button>
            </div>

            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink" role="status">
                <Mascot mood="think" size={64} />
                <p className="text-base text-paper/80">{s.cameraStarting}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-ink px-8 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              size="icon-lg"
              variant="ink"
              className="bg-paper/15 text-paper hover:bg-paper/25"
              onClick={() => fileInputRef.current?.click()}
              aria-label={s.cameraGallery}
            >
              <ImagePlus aria-hidden="true" />
            </Button>
            <button
              type="button"
              onClick={capture}
              disabled={!ready}
              aria-label={s.cameraShutter}
              className="grid size-20 cursor-pointer place-items-center rounded-full border-4 border-paper outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-paper disabled:opacity-40 motion-safe:active:scale-95"
            >
              <span className="size-14 rounded-full bg-sunrise" />
            </button>
            <span className="size-14" aria-hidden="true" />
          </div>
        </>
      )}
    </div>
  );
}
