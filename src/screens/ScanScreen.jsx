import { useState, useCallback, useRef } from "react";
import { Camera, Type, Loader2, Volume2, StopCircle } from "lucide-react";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useApp } from "../context/AppContext";
import { useTranslations } from "../hooks/useTranslations";
import { explainWord } from "../services/geminiService";
import { extractTextFromImage } from "../services/ocrService";
import WordPopup from "../components/WordPopup";
import CameraScanner from "../components/CameraScanner";
import Mascot from "../components/Mascot";

export default function ScanScreen() {
  const { state, dispatch } = useApp();
  const t = useTranslations();
  const [mode, setMode] = useState("camera"); // "camera" | "text"
  const [rawText, setRawText] = useState("");
  const [isOCRing, setIsOCRing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [recentWords, setRecentWords] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const debounceRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // When arriving from a book, pre-load its text
  const bookText = state.currentBook?.text;
  const displayText = rawText || bookText || "";

  const tokenize = (text) => {
    return text.split(/(\s+|[.,!?;:"""''()\[\]])/).filter(Boolean);
  };

  const handleImageCapture = async (file) => {
    if (!file) return;
    setShowCamera(false);
    setIsOCRing(true);
    setOcrProgress(0);
    stop();
    try {
      const text = await extractTextFromImage(file, setOcrProgress);
      setRawText(text);
      if (text) speak(text);
    } catch {
      setRawText("");
    } finally {
      setIsOCRing(false);
    }
  };

  const findSentence = (tokens, index) => {
    // Find the sentence containing the tapped word
    const fullText = tokens.join("");
    const before = tokens.slice(0, index).join("");
    const sentenceStart = Math.max(
      before.lastIndexOf(".") + 1,
      before.lastIndexOf("!") + 1,
      before.lastIndexOf("?") + 1,
      0
    );
    const after = fullText.substring(before.length);
    const endMatch = after.search(/[.!?]/);
    const sentenceEnd =
      endMatch >= 0 ? before.length + endMatch + 1 : fullText.length;
    return fullText.substring(sentenceStart, sentenceEnd).trim();
  };

  const handleWordTap = useCallback(
    (word, tokens, index) => {
      const clean = word.replace(/[^a-zA-Z]/g, "");
      if (!clean) return;

      // Debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const lower = clean.toLowerCase();
        const cacheKey = `${lower}_${state.language}`;

        // Check cache (language-specific)
        if (state.wordCache[cacheKey]) {
          setSelectedWord(state.wordCache[cacheKey]);
          return;
        }

        setWordLoading(true);
        const sentence = findSentence(tokens, index);
        try {
          const result = await explainWord({
            word: clean,
            sentence,
            targetLanguage: state.language,
          });
          dispatch({
            type: "CACHE_WORD",
            payload: { word: cacheKey, data: result },
          });
          setSelectedWord(result);
          setRecentWords((prev) => {
            const filtered = prev.filter((w) => w !== clean);
            return [clean, ...filtered].slice(0, 8);
          });
        } catch {
          setSelectedWord({
            word: clean,
            phonetic: `/${clean}/`,
            english: "A word found in your reading.",
            translation: "Tan-awa sa diksyunaryo ang buot silingon sini.",
            emoji: "📖",
            difficulty: "easy",
            example: null,
          });
        } finally {
          setWordLoading(false);
        }
      }, 300);
    },
    [state.wordCache, state.language, dispatch]
  );

  const tokens = tokenize(displayText);

  return (
    <div className="min-h-screen bg-[#111] pb-nav">
      {/* Top bar */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mascot size={28} />
          <h1 className="font-heading text-lg font-bold text-white">{t.scan.title}</h1>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-white/10 rounded-full p-0.5">
          <button
            onClick={() => setMode("camera")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
              mode === "camera"
                ? "bg-teal text-white"
                : "text-white/60"
            }`}
          >
            <Camera size={14} /> {t.scan.modeCamera}
          </button>
          <button
            onClick={() => setMode("text")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
              mode === "text"
                ? "bg-teal text-white"
                : "text-white/60"
            }`}
          >
            <Type size={14} /> {t.scan.modeText}
          </button>
        </div>

        {/* LIVE badge */}
        <span className="bg-coral text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
          {t.scan.live}
        </span>
      </div>

      {/* Viewfinder area */}
      <div className="px-4">
        <div className="relative bg-white rounded-2xl mx-auto overflow-hidden" style={{ width: "84%" }}>
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-teal rounded-tl" />
          <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-teal rounded-tr" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-teal rounded-bl" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-teal rounded-br" />

          {/* Scan line */}
          {(isOCRing || (!displayText && mode === "camera")) && (
            <div className="absolute left-2 right-2 h-0.5 bg-teal/60 animate-scanLine z-10 rounded-full shadow-[0_0_8px_rgba(46,196,182,0.5)]" />
          )}

          <div
            className={`p-5 min-h-[320px] ${
              state.colorOverlay === "yellow"
                ? "overlay-yellow"
                : state.colorOverlay === "blue"
                ? "overlay-blue"
                : state.colorOverlay === "pink"
                ? "overlay-pink"
                : ""
            }`}
          >
            {/* OCR loading */}
            {isOCRing && (
              <div className="flex flex-col items-center justify-center h-[280px] gap-3">
                <Mascot size={48} />
                <p className="text-muted-text text-sm font-semibold">
                  Ginabasa ni Owl ang libro...
                </p>
                <div className="w-48 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 bg-teal rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                <p className="text-muted-text text-xs">{ocrProgress}%</p>
              </div>
            )}

            {/* Word loading overlay */}
            {wordLoading && (
              <div className="absolute inset-0 bg-white/60 z-20 flex flex-col items-center justify-center">
                <Mascot size={40} />
                <Loader2 size={20} className="animate-spin text-teal mt-2" />
                <p className="text-muted-text text-xs mt-1">{t.scan.loading}</p>
              </div>
            )}

            {/* Text mode input */}
            {mode === "text" && !displayText && (
              <textarea
                ref={textareaRef}
                className="w-full h-[280px] resize-none bg-transparent text-dark-text text-sm leading-relaxed outline-none placeholder:text-muted-text/50"
                placeholder={t.scan.textPlaceholder}
                defaultValue=""
              />
            )}

            {/* Camera mode - no text yet */}
            {mode === "camera" && !displayText && !isOCRing && (
              <div className="flex flex-col items-center justify-center h-[280px] gap-4">
                <Mascot size={48} />
                <p className="text-muted-text text-sm text-center font-semibold">
                  {t.scan.cameraPrompt}
                </p>
                <button
                  onClick={() => setShowCamera(true)}
                  className="bg-teal text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Camera size={18} />
                  {t.scan.openCamera}
                </button>
              </div>
            )}

            {/* Rendered words */}
            {displayText && !isOCRing && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-muted-text/50 text-xs font-semibold">
                    {t.scan.tapHint}
                  </p>
                  <button
                    onClick={() => isSpeaking ? stop() : speak(displayText)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      isSpeaking
                        ? "bg-coral/20 text-coral"
                        : "bg-teal/15 text-teal"
                    }`}
                  >
                    {isSpeaking ? (
                      <><StopCircle size={13} /> Stop</>
                    ) : (
                      <><Volume2 size={13} /> Read</>  
                    )}
                  </button>
                </div>
                <div className="leading-loose">
                  {tokens.map((token, i) => {
                    const isWord = /[a-zA-Z]/.test(token);
                    if (!isWord) {
                      return <span key={i}>{token}</span>;
                    }
                    return (
                      <span
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleWordTap(token, tokens, i)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleWordTap(token, tokens, i)}
                        className="tappable inline-block px-0.5 rounded cursor-pointer transition-all underline decoration-teal/40 decoration-dotted underline-offset-4 hover:decoration-teal hover:decoration-solid hover:decoration-2 hover:bg-sun-yellow/20 active:bg-sun-yellow/30 active:decoration-teal active:decoration-2"
                      >
                        {token}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom recent words panel */}
      <div className="mt-4 px-4">
        <div className="bg-deep-teal rounded-2xl p-4">
          <p className="text-white/60 text-xs font-semibold mb-2">
            {t.scan.recentLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {recentWords.length === 0 && (
              <p className="text-white/30 text-xs">
                {t.scan.recentEmpty}
              </p>
            )}
            {recentWords.map((w) => (
              <span
                key={w}
                className="bg-teal/20 text-teal text-xs font-semibold px-3 py-1 rounded-full"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Camera input for re-scan */}
      {mode === "camera" && displayText && (
        <div className="px-4 mt-3">
          <button
            onClick={() => {
              stop();
              setRawText("");
              dispatch({ type: "SET_CURRENT_BOOK", payload: null });
              setShowCamera(true);
            }}
            className="w-full bg-teal/20 text-teal text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Camera size={16} />
            {t.scan.rescanBtn}
          </button>
        </div>
      )}

      {/* Text mode submit */}
      {mode === "text" && !displayText && (
        <div className="px-4 mt-3">
          <button
            onClick={() => {
              const val = textareaRef.current?.value;
              if (val?.trim()) {
                setRawText(val.trim());
                speak(val.trim());
              }
            }}
            className="w-full bg-teal text-white text-sm font-bold py-3 rounded-xl"
          >
            {t.scan.showTextBtn}
          </button>
        </div>
      )}

      {mode === "text" && displayText && (
        <div className="px-4 mt-3">
          <button
            onClick={() => { stop(); setRawText(""); }}
            className="w-full bg-teal/20 text-teal text-sm font-bold py-3 rounded-xl"
          >
            {t.scan.newTextBtn}
          </button>
        </div>
      )}

      {/* Word Popup */}
      {selectedWord && (
        <WordPopup
          wordData={selectedWord}
          onClose={() => setSelectedWord(null)}
          onSave={() => setSelectedWord(null)}
        />
      )}

      {/* Live Camera Scanner */}
      {showCamera && (
        <CameraScanner
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
