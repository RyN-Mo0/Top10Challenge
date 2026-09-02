import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import Hero from "./components/Hero";
import Categories from "./components/Categories";
import GameSetupModal from "./components/GameSetupModal";
import GameScreen from "./components/GameScreen";

function App() {
  const [view, setView] = useState("home");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [gameSetup, setGameSetup] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const handleCategoriesReady = (categories) => {
    setSelectedCategories(categories);
    setShowSetup(true);
  };

  const handleStartGame = ({ team1, team2 }) => {
    setGameSetup({ team1, team2, categories: selectedCategories });
    setShowSetup(false);
    setIsGameStarted(true);
  };

  if (isGameStarted && gameSetup) {
    return (
      <GameScreen
        gameSetup={gameSetup}
        onExit={() => {
          setIsGameStarted(false);
          setGameSetup(null);
          setSelectedCategories([]);
          setView("home");
        }}
      />
    );
  }

  return (
    <main dir="rtl" className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-900">
      {view === "home" && <Hero onStart={() => setView("categories")} />}

      {view === "categories" && (
        <Categories
          onContinue={handleCategoriesReady}
          onBack={() => setView("home")}
        />
      )}

      <AnimatePresence>
        {showSetup && (
          <GameSetupModal
            categories={selectedCategories}
            onClose={() => setShowSetup(false)}
            onStart={handleStartGame}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
