import { memo, useEffect } from "react";
import { X, Volume2, Check, BookOpen, StopCircle, Trash2 } from "lucide-react";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useApp } from "../context/AppContext";
import { useTranslations } from "../hooks/useTranslations";

const difficultyConfig = {
  easy: { color: "bg-leaf-green", label: "Dali" },
  medium: { color: "bg-sun-yellow", label: "Medyo" },
  hard: { color: "bg-coral", label: "Budlay" },
};

const WordPopup = memo(function WordPopup({ wordData, onClose, onSave }) {
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const { state, dispatch } = useApp();
  const t = useTranslations();
  if (!wordData) return null;

  const isLearned = state.wordsLearned.some(
    (w) => w.word.toLowerCase() === wordData.word.toLowerCase()
  );

  const config = difficultyConfig[wordData.difficulty] || {
    color: "bg-gray-400",
    label: wordData.difficulty,
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(wordData.word, state.ttsSpeed);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    dispatch({ type: "LEARN_WORD", payload: wordData });
    onSave?.(wordData);
  };

  const handleRemove = () => {
    dispatch({ type: "REMOVE_WORD", payload: wordData.word });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-popup-heading"
        className="relative w-full max-w-[390px] bg-white rounded-t-[28px] animate-slideUp shadow-2xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-muted-text"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-2 pb-8">
          {/* Word header */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f0f9ff, #e0f7fa)" }}
            >
              <span className="text-4xl">{wordData.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="word-popup-heading" className="font-heading text-2xl font-bold text-dark-text leading-tight">
                {wordData.word}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-lavender text-sm">
                  {wordData.phonetic}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white ${config.color}`}
                >
                  {config.label}
                </span>
              </div>
            </div>
          </div>

          {/* English definition */}
          <div className="bg-sky-blue/10 rounded-2xl p-3.5 mb-2.5 border border-sky-blue/15">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen size={13} className="text-sky-blue" />
              <p className="text-xs font-bold text-sky-blue">{t.popup.englishLabel}</p>
            </div>
            <p className="text-dark-text text-sm leading-relaxed">{wordData.english}</p>
          </div>

          {/* Translation */}
          <div className="bg-teal/10 rounded-2xl p-3.5 mb-2.5 border border-teal/15">
            <p className="text-xs font-bold text-teal mb-1">
              {t.popup.translationLabel}
            </p>
            <p className="text-dark-text text-sm leading-relaxed">{wordData.translation}</p>
          </div>

          {/* Example sentence — shown if provided by Gemini */}
          {wordData.example && (
            <div className="bg-lavender/10 rounded-2xl p-3.5 mb-2.5 border border-lavender/15">
              <p className="text-xs font-bold text-lavender mb-1">{t.popup.exampleLabel}</p>
              <p className="text-dark-text text-sm leading-relaxed italic">
                "{wordData.example}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSpeak}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${isSpeaking ? "animate-pulse" : ""}`}
              style={{
                background: isSpeaking
                  ? "linear-gradient(135deg, #F4614A, #F97316)"
                  : "linear-gradient(135deg, #38BDF8, #0EA5A0)",
                color: "white",
              }}
            >
              {isSpeaking ? <StopCircle size={17} /> : <Volume2 size={17} />}
              {isSpeaking ? t.popup.speakingBtn : t.popup.speakBtn}
            </button>
            {isLearned ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-leaf-green/15 text-leaf-green border border-leaf-green/30 font-bold text-sm">
                  <Check size={17} />
                  {t.popup.savedBtn}
                </div>
                <button
                  onClick={handleRemove}
                  aria-label="Remove word"
                  className="p-3.5 rounded-2xl bg-gray-100 text-muted-text hover:bg-coral/15 hover:text-coral transition-colors"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-leaf-green text-white"
              >
                <Check size={17} />
                {t.popup.saveBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WordPopup;
