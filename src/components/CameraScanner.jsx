import { useEffect, useRef, useState } from "react";
import { X, Circle, SwitchCamera, ImagePlus } from "lucide-react";
import Mascot from "./Mascot";

export default function CameraScanner({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [flash, setFlash] = useState(false);

  const startCamera = async (facing = "environment") => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("permission");
      } else if (err.name === "NotFoundError") {
        setError("notfound");
      } else {
        setError("generic");
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const nativeW = video.videoWidth;
    const nativeH = video.videoHeight;

    // Measure the video element's rendered CSS size (object-cover)
    const rect = video.getBoundingClientRect();
    const cW = rect.width;
    const cH = rect.height;

    // object-cover: scale so the video completely fills the container
    const scale = Math.max(cW / nativeW, cH / nativeH);

    // The video is centered — compute how far it's offset from the container edge
    const oX = (cW - nativeW * scale) / 2;
    const oY = (cH - nativeH * scale) / 2;

    // Bracket guide: 80% wide, 4:3 aspect, centered (matches the UI overlay)
    const bracketCSSW = cW * 0.8;
    const bracketCSSH = bracketCSSW * (3 / 4);
    const bracketCSSLeft = (cW - bracketCSSW) / 2;
    const bracketCSSTop = (cH - bracketCSSH) / 2;

    // Map bracket CSS coordinates → native video pixel coordinates
    const srcX = Math.max(0, Math.round((bracketCSSLeft - oX) / scale));
    const srcY = Math.max(0, Math.round((bracketCSSTop - oY) / scale));
    const srcW = Math.min(Math.round(bracketCSSW / scale), nativeW - srcX);
    const srcH = Math.min(Math.round(bracketCSSH / scale), nativeH - srcY);

    // Draw only the cropped bracket region
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
        // Stop stream before handing off
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Gallery fallback
  const handleGallery = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none" />
      )}

      {/* Error states */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <Mascot size={56} />
          {error === "permission" && (
            <>
              <p className="text-white font-heading text-lg font-bold">
                Kinahanglan ang camera permission
              </p>
              <p className="text-white/60 text-sm">
                I-allow ang camera sa imo browser settings, unya reload ang
                page.
              </p>
            </>
          )}
          {error === "notfound" && (
            <>
              <p className="text-white font-heading text-lg font-bold">
                Wala sang camera
              </p>
              <p className="text-white/60 text-sm">
                Gamiton ang gallery para mag-upload sang retrato.
              </p>
            </>
          )}
          {error === "generic" && (
            <>
              <p className="text-white font-heading text-lg font-bold">
                May problema ang camera
              </p>
              <p className="text-white/60 text-sm">
                Subuka liwat ukon gamiton ang gallery.
              </p>
            </>
          )}
          {/* Gallery fallback on error */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-teal text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <ImagePlus size={18} />
            Pilion sa Gallery
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGallery}
          />
          <button
            onClick={onClose}
            className="text-white/50 text-sm underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Live viewfinder */}
      {!error && (
        <>
          {/* Video */}
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Scan line animation */}
            {ready && (
              <div className="absolute left-[8%] right-[8%] h-0.5 bg-teal/70 animate-scanLine rounded-full shadow-[0_0_10px_rgba(46,196,182,0.6)]" />
            )}

            {/* Corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[80%]" style={{ aspectRatio: "4/3" }}>
                {/* TL */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-3 border-t-3 border-teal rounded-tl-lg" />
                {/* TR */}
                <div className="absolute top-0 right-0 w-8 h-8 border-r-3 border-t-3 border-teal rounded-tr-lg" />
                {/* BL */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-3 border-b-3 border-teal rounded-bl-lg" />
                {/* BR */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-3 border-b-3 border-teal rounded-br-lg" />
                {/* Dim areas outside bracket */}
                <div className="absolute inset-0 rounded-lg ring-[999px] ring-black/40" />
              </div>
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10 pb-4 bg-gradient-to-b from-black/60 to-transparent">
              <button
                onClick={() => {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                  onClose();
                }}
                aria-label="Isira ang camera"
                className="w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center"
              >
                <X size={20} className="text-white" />
              </button>
              <div className="text-center">
                <p className="text-white text-xs font-semibold">
                  Ibutang ang libro sa loob sang parisukat
                </p>
              </div>
              <button
                onClick={handleFlipCamera}
                aria-label="I-flip ang camera"
                className="w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center"
              >
                <SwitchCamera size={18} className="text-white" />
              </button>
            </div>

            {/* Loading overlay before stream is ready */}
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3">
                <Mascot size={48} />
                <p className="text-white/60 text-sm">
                  Ginabuksan ang camera...
                </p>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="bg-black flex items-center justify-between px-10 py-6 safe-bottom">
            {/* Gallery button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Pilion sa Gallery"
              className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center"
            >
              <ImagePlus size={22} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGallery}
            />

            {/* Shutter button */}
            <button
              onClick={capturePhoto}
              disabled={!ready}
              aria-label="Kuha ng larawan"
              aria-disabled={!ready}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95 ${
                ready ? "bg-white/20" : "bg-white/10 opacity-50"
              }`}
            >
              <Circle
                size={48}
                className="text-white fill-white"
                strokeWidth={0}
              />
            </button>

            {/* Placeholder for symmetry */}
            <div className="w-12 h-12" />
          </div>
        </>
      )}
    </div>
  );
}
