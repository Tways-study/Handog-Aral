import { useState, useMemo, useCallback } from "react";
import { useApp } from "../context/AppContext";
import Mascot from "../components/Mascot";
import { ChevronRight, RotateCcw, Trophy, Camera } from "lucide-react";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const QUESTIONS_PER_ROUND = 5;

export default function QuizScreen({ onNavigate }) {
  const { state, dispatch } = useApp();
  const words = state.wordsLearned;

  // Build quiz questions from learned words
  const questions = useMemo(() => {
    if (words.length < 4) return [];
    const pool = shuffle(words);
    const count = Math.min(QUESTIONS_PER_ROUND, pool.length);
    return pool.slice(0, count).map((word) => {
      const distractors = shuffle(
        words.filter((w) => w.word !== word.word)
      ).slice(0, 3);
      const options = shuffle([word, ...distractors]);
      return { word, options };
    });
  }, [words]); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = useCallback(
    (option) => {
      if (selected !== null) return;
      const correct = option.word === questions[currentQ].word.word;
      setSelected(option.word);
      setAnswers((prev) => [...prev, correct]);
    },
    [selected, currentQ, questions]
  );

  const handleNext = useCallback(() => {
    if (currentQ + 1 >= questions.length) {
      setShowResult(true);
    } else {
      setCurrentQ((v) => v + 1);
      setSelected(null);
    }
  }, [currentQ, questions.length]);

  const handleReset = useCallback(() => {
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);
  }, []);

  // Not enough words
  if (words.length < 4) {
    return (
      <div className="min-h-screen bg-cream pb-24 flex flex-col items-center justify-center px-6 text-center">
        <Mascot size={72} />
        <h2 className="font-heading text-xl font-bold text-dark-text mt-5 mb-2">
          Kulang pa ang mga pulong!
        </h2>
        <p className="text-muted-text text-sm leading-relaxed mb-6">
          Kinahanglan mo sang labing menos 4 ka pulong para mag-quiz.
          <br />
          Mag-scan sang libro kag tap-a ang mga bag-o nga pulong!
        </p>
        <button
          onClick={() => onNavigate("scan")}
          className="flex items-center gap-2 bg-teal text-white font-bold px-6 py-3.5 rounded-2xl shadow-md"
          style={{ boxShadow: "0 4px 16px rgba(46,196,182,0.3)" }}
        >
          <Camera size={18} />
          Mag-Scan
        </button>
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const score = answers.filter(Boolean).length;
    const total = questions.length;
    const pct = Math.round((score / total) * 100);

    // Persist high score and award a star on perfect
    dispatch({ type: "SET_QUIZ_HIGH_SCORE", payload: score });
    if (score === total) dispatch({ type: "ADD_STAR" });

    const resultEmoji = pct === 100 ? "🏆" : pct >= 60 ? "🌟" : "😊";
    const resultMsg =
      pct === 100
        ? "Perpekto! Ikaw ang champion!"
        : pct >= 80
        ? "Maayo gid ka! Dugang pa!"
        : pct >= 60
        ? "Maayo! Padayon lang!"
        : "Sige pa, you can do it!";

    return (
      <div className="min-h-screen bg-cream pb-24">
        <div
          className="px-5 pt-10 pb-8 rounded-b-[36px] text-center"
          style={{
            background: "linear-gradient(135deg, #A29BFE 0%, #6C63FF 100%)",
          }}
        >
          <span className="text-6xl block mb-3">{resultEmoji}</span>
          <h1 className="font-heading text-3xl font-bold text-white mb-1">
            {score}/{total} Tama!
          </h1>
          <p className="text-white/80 text-sm">{resultMsg}</p>
        </div>

        <div className="px-5 mt-6 space-y-3 animate-fadeUp">
          {/* High score badge */}
          {(state.quizHighScore || 0) > 0 && (
            <div className="bg-sun-yellow/15 rounded-2xl p-4 flex items-center gap-3 border border-sun-yellow/30">
              <Trophy size={22} className="text-soft-orange flex-shrink-0" />
              <div>
                <p className="font-heading font-bold text-sm text-dark-text">
                  Pinaka-mataas na Score
                </p>
                <p className="text-muted-text text-xs">
                  {state.quizHighScore}/{total} tama
                </p>
              </div>
            </div>
          )}

          {/* Per-question recap */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {questions.map((q, i) => (
              <div
                key={q.word.word}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < questions.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <span className="text-xl">{q.word.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-dark-text truncate">
                    {q.word.word}
                  </p>
                  <p className="text-muted-text text-xs truncate">
                    {q.word.translation}
                  </p>
                </div>
                <span className="text-lg flex-shrink-0">
                  {answers[i] ? "✅" : "❌"}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-gray-200 text-dark-text font-bold text-sm"
            >
              <RotateCcw size={16} />
              Liwat
            </button>
            <button
              onClick={() => onNavigate("vocabulary")}
              className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #2EC4B6, #1A3C40)" }}
            >
              Tan-awa ang Pulong
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz
  const q = questions[currentQ];
  const isAnswered = selected !== null;
  const progress = ((currentQ + (isAnswered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6 rounded-b-[36px]"
        style={{
          background: "linear-gradient(135deg, #A29BFE 0%, #6C63FF 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">Vocabulary Quiz 🧠</p>
            <h1 className="font-heading text-xl font-bold text-white">
              Pangutana {currentQ + 1} / {questions.length}
            </h1>
          </div>
          <Mascot size={40} />
        </div>

        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-2">
          <div
            className="h-2 bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-5 mt-6">
        {/* Word card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center mb-5">
          <span className="text-5xl block mb-3">{q.word.emoji}</span>
          <h2 className="font-heading text-3xl font-bold text-dark-text mb-1.5">
            {q.word.word}
          </h2>
          <p className="text-muted-text text-sm leading-relaxed">
            {q.word.english}
          </p>
          <p className="text-lavender text-sm font-semibold mt-1">
            {q.word.phonetic}
          </p>
        </div>

        <p className="text-center text-muted-text text-sm font-semibold mb-4">
          Ano ang buot sipdon sini sa{" "}
          {state.language === "hiligaynon" ? "Hiligaynon" : "Filipino"}?
        </p>

        {/* Options */}
        <div className="space-y-2.5 animate-fadeUp">
          {q.options.map((option, idx) => {
            const isCorrect = option.word === q.word.word;
            const isSelected = selected === option.word;
            let style = "bg-white border-gray-100";
            if (isAnswered) {
              if (isCorrect)
                style =
                  "bg-leaf-green/15 border-leaf-green/40 shadow-sm shadow-leaf-green/10";
              else if (isSelected) style = "bg-coral/15 border-coral/40";
            }

            return (
              <button
                key={option.word}
                onClick={() => handleSelect(option)}
                className={`w-full rounded-2xl p-4 border text-left tappable flex items-center gap-3 transition-all ${style}`}
              >
                <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-muted-text flex-shrink-0">
                  {["A", "B", "C", "D"][idx]}
                </span>
                <p className="text-dark-text font-semibold text-sm flex-1 leading-snug">
                  {option.translation}
                </p>
                {isAnswered && isCorrect && (
                  <span className="text-leaf-green font-bold text-lg flex-shrink-0">
                    ✓
                  </span>
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <span className="text-coral font-bold text-lg flex-shrink-0">
                    ✗
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            className="w-full mt-5 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 animate-fadeUp"
            style={{
              background: "linear-gradient(135deg, #2EC4B6, #1A3C40)",
              boxShadow: "0 4px 16px rgba(46,196,182,0.25)",
            }}
          >
            {currentQ + 1 >= questions.length
              ? "Tan-awa ang Resulta 🏆"
              : "Sunod nga Pangutana"}
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
