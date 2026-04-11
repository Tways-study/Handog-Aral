import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useTranslations } from "../hooks/useTranslations";
import WordPopup from "../components/WordPopup";
import Mascot from "../components/Mascot";
import { Search } from "lucide-react";

const difficultyColors = {
  easy: {
    bg: "bg-leaf-green/10",
    border: "border-leaf-green/25",
    text: "text-leaf-green",
    badge: "bg-leaf-green text-white",
  },
  medium: {
    bg: "bg-sun-yellow/10",
    border: "border-sun-yellow/30",
    text: "text-soft-orange",
    badge: "bg-sun-yellow text-deep-teal",
  },
  hard: {
    bg: "bg-coral/10",
    border: "border-coral/25",
    text: "text-coral",
    badge: "bg-coral text-white",
  },
};

export default function VocabularyScreen() {
  const { state } = useApp();
  const t = useTranslations();
  const [selectedWord, setSelectedWord] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const words = state.wordsLearned;

  const filters = [
    { id: "all", label: t.vocabulary.filterAll },
    { id: "easy", label: t.vocabulary.filterEasy },
    { id: "medium", label: t.vocabulary.filterMedium },
    { id: "hard", label: t.vocabulary.filterHard },
  ];

  const diffLabel = (d) =>
    d === "easy" ? t.vocabulary.diffEasy : d === "medium" ? t.vocabulary.diffMedium : t.vocabulary.diffHard;

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchesSearch =
        !searchQuery ||
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.translation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === "all" || w.difficulty === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [words, searchQuery, activeFilter]);

  const easyCount = words.filter((w) => w.difficulty === "easy").length;
  const mediumCount = words.filter((w) => w.difficulty === "medium").length;
  const hardCount = words.filter((w) => w.difficulty === "hard").length;

  return (
    <div className="min-h-screen bg-cream pb-nav">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-7 rounded-b-[36px]"
        style={{
          background: "linear-gradient(135deg, #38BDF8 0%, #0EA5A0 100%)",
        }}
      >
        <h1 className="font-heading text-2xl font-bold text-white mb-1">
          {t.vocabulary.title}
        </h1>
        <p className="text-white/80 text-sm">
          {words.length > 0
            ? t.vocabulary.subtitleWords(words.length)
            : t.vocabulary.subtitleEmpty}
        </p>

        {words.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/25 rounded-xl p-3 text-center">
              <p className="text-white font-extrabold text-xl font-heading leading-none">
                {easyCount}
              </p>
              <p className="text-white/80 text-xs font-semibold mt-0.5">
                {t.vocabulary.statEasy}
              </p>
            </div>
            <div className="bg-white/25 rounded-xl p-3 text-center">
              <p className="text-white font-extrabold text-xl font-heading leading-none">
                {mediumCount}
              </p>
              <p className="text-white/80 text-xs font-semibold mt-0.5">
                {t.vocabulary.statMedium}
              </p>
            </div>
            <div className="bg-white/25 rounded-xl p-3 text-center">
              <p className="text-white font-extrabold text-xl font-heading leading-none">
                {hardCount}
              </p>
              <p className="text-white/80 text-xs font-semibold mt-0.5">
                {t.vocabulary.statHard}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 mt-4">
        {words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Mascot size={56} />
            <p className="text-muted-text text-sm text-center leading-relaxed">
              {t.vocabulary.emptyTitle}
              <br />
              {t.vocabulary.emptyBody}
            </p>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="relative mb-3">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.vocabulary.searchPlaceholder}
                aria-label={t.vocabulary.searchPlaceholder}
                className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm text-dark-text outline-none border border-gray-100 focus:ring-2 focus:ring-lavender/30"
              />
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-0.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  aria-pressed={activeFilter === f.id}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeFilter === f.id
                      ? "bg-lavender text-white shadow-sm"
                      : "bg-white text-muted-text border border-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredWords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-text text-sm">
                  {t.vocabulary.noResults}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 animate-fadeUp">
                {filteredWords.map((w, i) => {
                  const colors =
                    difficultyColors[w.difficulty] || difficultyColors.easy;
                  return (
                    <button
                      key={`${w.word}-${i}`}
                      onClick={() => setSelectedWord(w)}
                      className={`tappable rounded-2xl p-4 border text-left ${colors.bg} ${colors.border}`}
                    >
                      <span className="text-2xl block mb-1.5">{w.emoji}</span>
                      <p className="font-heading font-bold text-sm text-dark-text truncate">
                        {w.word}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${colors.text}`}>
                        {w.phonetic}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}
                      >
                        {diffLabel(w.difficulty)}
                      </span>
                    </button>
                  );
                })}

                {/* Mystery placeholder cards */}
                {words.length < 6 &&
                  activeFilter === "all" &&
                  !searchQuery &&
                  Array.from({ length: Math.max(0, 6 - words.length) }).map(
                    (_, i) => (
                      <div
                        key={`mystery-${i}`}
                        className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[120px]"
                      >
                        <span className="text-2xl mb-1 opacity-20">â“</span>
                        <p className="text-muted-text/30 text-xs font-bold">
                          ???
                        </p>
                      </div>
                    )
                  )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedWord && (
        <WordPopup
          wordData={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}

