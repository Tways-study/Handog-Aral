import { createContext, useContext, useReducer, useEffect } from "react";

const AppContext = createContext(null);

const initialState = {
  childName: "",
  language: "hiligaynon",
  fontSize: "medium",
  dyslexiaFont: false,
  ttsSpeed: 0.8,
  colorOverlay: "none",
  stars: 0,
  wordsLearned: [],
  currentBook: null,
  wordCache: {},
  bookProgress: {},
  streak: 0,
  lastActiveDate: null,
  quizHighScore: 0,
};

function loadState() {
  try {
    const saved = localStorage.getItem("handog-aral-state");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch {
    // ignore
  }
  return initialState;
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, childName: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_FONT_SIZE":
      return { ...state, fontSize: action.payload };
    case "SET_DYSLEXIA_FONT":
      return { ...state, dyslexiaFont: action.payload };
    case "SET_TTS_SPEED":
      return { ...state, ttsSpeed: action.payload };
    case "SET_COLOR_OVERLAY":
      return { ...state, colorOverlay: action.payload };
    case "ADD_STAR":
      return { ...state, stars: Math.min(5, state.stars + 1) };
    case "LEARN_WORD": {
      const word = action.payload;
      if (state.wordsLearned.find((w) => w.word === word.word)) return state;
      const newWords = [...state.wordsLearned, word];
      const newStars = Math.min(5, Math.floor(newWords.length / 3));
      return { ...state, wordsLearned: newWords, stars: newStars };
    }
    case "CACHE_WORD":
      return {
        ...state,
        wordCache: { ...state.wordCache, [action.payload.word.toLowerCase()]: action.payload.data },
      };
    case "SET_CURRENT_BOOK":
      return { ...state, currentBook: action.payload };
    case "SET_BOOK_PROGRESS":
      return {
        ...state,
        bookProgress: { ...state.bookProgress, [action.payload.id]: action.payload.progress },
      };
    case "UPDATE_STREAK": {
      const today = new Date().toISOString().split("T")[0];
      if (state.lastActiveDate === today) return state;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newStreak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
      return { ...state, streak: newStreak, lastActiveDate: today };
    }
    case "SET_QUIZ_HIGH_SCORE":
      return { ...state, quizHighScore: Math.max(state.quizHighScore || 0, action.payload) };
    case "RESET_PROGRESS":
      return { ...initialState, childName: state.childName, language: state.language };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);

  useEffect(() => {
    try {
      localStorage.setItem("handog-aral-state", JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    document.body.className = "";
    if (state.dyslexiaFont) document.body.classList.add("dyslexia-font");
    document.documentElement.classList.remove("font-small", "font-medium", "font-large");
    document.documentElement.classList.add(`font-${state.fontSize}`);
  }, [state.dyslexiaFont, state.fontSize]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
