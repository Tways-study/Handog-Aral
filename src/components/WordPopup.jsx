import { memo } from "react";
import { X, Volume2, Check } from "lucide-react";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useApp } from "../context/AppContext";

const WordPopup = memo(function WordPopup({ wordData, onClose, onSave }) {
  const { speak } = useTextToSpeech();
  const { state, dispatch } = useApp();
  if (!wordData) return null;

  const isLearned = state.wordsLearned.some(
    (w) => w.word.toLowerCase() === wordData.word.toLowerCase()
  );

  const handleSpeak = () => {
    speak(wordData.word, state.ttsSpeed);
  };

  const handleSave = () => {
    dispatch({ type: "LEARN_WORD", payload: wordData });
    onSave?.(wordData);
  };

  const difficultyColor = {
    easy: "bg-leaf-green",
    medium: "bg-sun-yellow",
    hard: "bg-coral",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-[390px] bg-white rounded-t-3xl animate-slideUp">
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 p-2 rounded-full bg-gray-100"
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-4 pb-8">
          {/* Word header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{wordData.emoji}</span>
            <div>
              <h2 className="font-heading text-2xl font-bold text-dark-text">
                {wordData.word}
              </h2>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                  difficultyColor[wordData.difficulty] || "bg-gray-400"
                }`}
              >
                {wordData.difficulty}
              </span>
            </div>
          </div>

          {/* Phonetic */}
          <div className="inline-block px-3 py-1 rounded-full bg-lavender/20 text-lavender font-semibold text-sm mb-4">
            {wordData.phonetic}
          </div>

          {/* English definition */}
          <div className="bg-sky-blue/10 rounded-xl p-3 mb-3">
            <p className="text-sm font-semibold text-sky-blue mb-1">English</p>
            <p className="text-dark-text text-sm">{wordData.english}</p>
          </div>

          {/* Translation */}
          <div className="bg-teal/10 rounded-xl p-3 mb-4">
            <p className="text-sm font-semibold text-teal mb-1">
              {state.language === "hiligaynon" ? "🗣 Hiligaynon" : "🇵🇭 Filipino"}
            </p>
            <p className="text-dark-text text-sm">{wordData.translation}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSpeak}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-lavender text-white font-bold text-sm"
            >
              <Volume2 size={18} />
              Paminawa
            </button>
            <button
              onClick={handleSave}
              disabled={isLearned}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm ${
                isLearned
                  ? "bg-leaf-green/20 text-leaf-green"
                  : "bg-leaf-green text-white"
              }`}
            >
              <Check size={18} />
              {isLearned ? "Natuon Na!" : "Natuon Na!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default WordPopup;
