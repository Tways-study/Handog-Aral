import { useState, useCallback, useRef } from "react";
import { Camera, Type, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { explainWord } from "../services/geminiService";
import { extractTextFromImage } from "../services/ocrService";
import { sightWords } from "../data/sightWords";
import WordPopup from "../components/WordPopup";
import CameraScanner from "../components/CameraScanner";
import Mascot from "../components/Mascot";

export default function ScanScreen() {
  const { state, dispatch } = useApp();
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

  // When arriving from a book, pre-load its text
  const bookText = state.currentBook?.text;
  const displayText = rawText || bookText || "";

  const tokenize = (text) => {
    return text.split(/(\s+|[.,!?;:"""''()\[\]])/).filter(Boolean);
  };

  const isComplexWord = (w) => {
    const clean = w.replace(/[^a-zA-Z]/g, "");
    if (!clean || clean.length < 2) return false;
    if (sightWords.has(clean.toLowerCase())) return false;
    return clean.length > 5;
  };

  const handleImageCapture = async (file) => {
    if (!file) return;
    setShowCamera(false);
    setIsOCRing(true);
    setOcrProgress(0);
    try {
      const text = await extractTextFromImage(file, setOcrProgress);
      setRawText(text);
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
      if (!clean || clean.length < 2) return;

      // Debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const lower = clean.toLowerCase();

        // Check cache
        if (state.wordCache[lower]) {
          setSelectedWord(state.wordCache[lower]);
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
            payload: { word: lower, data: result },
          });
          setSelectedWord(result);
          setRecentWords((prev) => {
            const filtered = prev.filter((w) => w !== clean);
            return [clean, ...filtered].slice(0, 8);
          });
        } catch {
          // fallback handled in service
        } finally {
          setWordLoading(false);
        }
      }, 300);
    },
    [state.wordCache, state.language, dispatch]
  );

  const tokens = tokenize(displayText);

  return (
    <div className="min-h-screen bg-[#111] pb-24">
      {/* Top bar */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mascot size={28} />
          <h1 className="font-heading text-lg font-bold text-white">I-Scan</h1>
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
            <Camera size={14} /> Camera
          </button>
          <button
            onClick={() => setMode("text")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
              mode === "text"
                ? "bg-teal text-white"
                : "text-white/60"
            }`}
          >
            <Type size={14} /> Text
          </button>
        </div>

        {/* LIVE badge */}
        <span className="bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
          LIVE
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
                <p className="text-muted-text text-xs mt-1">Ginapangita...</p>
              </div>
            )}

            {/* Text mode input */}
            {mode === "text" && !displayText && (
              <textarea
                className="w-full h-[280px] resize-none bg-transparent text-dark-text text-sm leading-relaxed outline-none placeholder:text-muted-text/50"
                placeholder="I-paste o i-type diri ang teksto sang libro..."
                onBlur={(e) => setRawText(e.target.value)}
                defaultValue=""
              />
            )}

            {/* Camera mode - no text yet */}
            {mode === "camera" && !displayText && !isOCRing && (
              <div className="flex flex-col items-center justify-center h-[280px] gap-4">
                <Mascot size={48} />
                <p className="text-muted-text text-sm text-center font-semibold">
                  Kuhai sang retrato ang libro
                </p>
                <button
                  onClick={() => setShowCamera(true)}
                  className="bg-teal text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Camera size={18} />
                  Buksa ang Camera
                </button>
              </div>
            )}

            {/* Rendered words */}
            {displayText && !isOCRing && (
              <div className="leading-loose">
                {tokens.map((token, i) => {
                  const isWord = /[a-zA-Z]{2,}/.test(token);
                  const complex = isComplexWord(token);
                  if (!isWord) {
                    return <span key={i}>{token}</span>;
                  }
                  return (
                    <span
                      key={i}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleWordTap(token, tokens, i)}
                      className={`tappable inline-block px-0.5 py-1 min-h-[44px] min-w-[44px] text-center rounded cursor-pointer transition-colors line-highlight ${
                        complex
                          ? "underline decoration-teal decoration-2 underline-offset-4 font-semibold"
                          : ""
                      } hover:bg-sun-yellow/20 active:bg-sun-yellow/30`}
                    >
                      {token}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom recent words panel */}
      <div className="mt-4 px-4">
        <div className="bg-deep-teal rounded-2xl p-4">
          <p className="text-white/60 text-xs font-semibold mb-2">
            Bag-o lang gin-tap:
          </p>
          <div className="flex flex-wrap gap-2">
            {recentWords.length === 0 && (
              <p className="text-white/30 text-xs">
                Tap-a ang bisan ano nga pulong sa ibabaw ☝️
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
              setRawText("");
              dispatch({ type: "SET_CURRENT_BOOK", payload: null });
              setShowCamera(true);
            }}
            className="w-full bg-teal/20 text-teal text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Camera size={16} />
            I-scan Liwat
          </button>
        </div>
      )}

      {/* Text mode submit */}
      {mode === "text" && !displayText && (
        <div className="px-4 mt-3">
          <button
            onClick={() => {
              const textarea = document.querySelector("textarea");
              if (textarea?.value) setRawText(textarea.value);
            }}
            className="w-full bg-teal text-white text-sm font-bold py-3 rounded-xl"
          >
            Ipakita ang Teksto
          </button>
        </div>
      )}

      {mode === "text" && displayText && (
        <div className="px-4 mt-3">
          <button
            onClick={() => setRawText("")}
            className="w-full bg-teal/20 text-teal text-sm font-bold py-3 rounded-xl"
          >
            Bag-o nga Teksto
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
