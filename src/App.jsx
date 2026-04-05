import { useState, useCallback } from "react";
import { AppProvider } from "./context/AppContext";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import ScanScreen from "./screens/ScanScreen";
import BooksScreen from "./screens/BooksScreen";
import VocabularyScreen from "./screens/VocabularyScreen";
import SettingsScreen from "./screens/SettingsScreen";
import QuizScreen from "./screens/QuizScreen";
import BottomNav from "./components/BottomNav";

function AppContent() {
  const [screen, setScreen] = useState("splash");

  const navigate = useCallback((s) => setScreen(s), []);
  const onSplashDone = useCallback(() => setScreen("home"), []);

  if (screen === "splash") {
    return <SplashScreen onFinish={onSplashDone} />;
  }

  const screens = {
    home: <HomeScreen onNavigate={navigate} />,
    scan: <ScanScreen />,
    books: <BooksScreen onNavigate={navigate} />,
    vocabulary: <VocabularyScreen />,
    quiz: <QuizScreen onNavigate={navigate} />,
    settings: <SettingsScreen />,
  };

  return (
    <div className="max-w-[390px] mx-auto min-h-screen relative bg-cream">
      {screens[screen] || screens.home}
      <BottomNav current={screen} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
