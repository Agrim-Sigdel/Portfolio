import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from './shared/lib/ThemeContext';
import ModeSelector from './features/modeSelection/ui/ModeSelector';
import Preloader from './shared/ui/Preloader';
import Terminal from './features/terminalMode/ui/Terminal';
import FunModePage from './pages/funMode/FunModePage';
import NormalModePage from './pages/normalMode/NormalModePage';
import './pages/funMode/funMode.css';
import './App.css';

function App() {
  const { theme } = useTheme();
  const [selectedMode, setSelectedMode] = useState(null); // null, 'fun', 'work', or 'normal'
  const [isLoading, setIsLoading] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);

  // Handle Theme Application based on Mode
  useEffect(() => {
    const root = document.documentElement;
    
    if (selectedMode === 'fun') {
      // Fun mode respects user preference (light/dark)
      root.setAttribute('data-theme', theme);
    } else if (selectedMode === 'work') {
      // Work/Terminal mode is always dark
      root.setAttribute('data-theme', 'dark');
    } else if (selectedMode === 'normal') {
      // Normal mode is always light
      root.setAttribute('data-theme', 'light');
    } else {
      // Start page (null) defaults to light
      root.setAttribute('data-theme', 'light');
    }
  }, [selectedMode, theme]);

  useEffect(() => {
    // Prevent scrolling during loading or mode selection
    if (isLoading || selectedMode === null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isLoading, selectedMode]);

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
    setShowPreloader(true);
    setIsLoading(true);
  };

  const handleSwitchToFun = () => {
    setIsLoading(true);
    setShowPreloader(true);
    setTimeout(() => {
      setSelectedMode('fun');
      setIsLoading(false);
    }, 2000);
  };

  const handleSwitchToNormal = () => {
    setIsLoading(true);
    setShowPreloader(true);
    setTimeout(() => {
      setSelectedMode('normal');
      setIsLoading(false);
    }, 2000);
  };

  const handleResetMode = () => {
    setSelectedMode(null);
    setShowPreloader(false);
    setIsLoading(false);
  };

  return (
    <div className="App">
      {/* Show mode selector first */}
      <AnimatePresence mode="wait">
        {selectedMode === null && (
          <ModeSelector onSelectMode={handleModeSelection} />
        )}
      </AnimatePresence>

      {/* Show preloader after mode selection */}
      <AnimatePresence mode="wait">
        {showPreloader && isLoading && (
          <Preloader onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* Render content based on selected mode */}
      {selectedMode && !isLoading && (
        <>
          {/* FUN MODE - Modern interactive website */}
          {selectedMode === 'fun' && (
            <FunModePage onResetMode={handleResetMode} onSwitchMode={handleSwitchToNormal} />
          )}

          {/* WORK MODE - Terminal interface */}
          {selectedMode === 'work' && (
            <Terminal
              onSwitchToFun={handleSwitchToFun}
              onSwitchToNormal={handleSwitchToNormal}
              onResetMode={handleResetMode}
            />
          )}

          {/* NORMAL MODE - Clean simple HTML */}
          {selectedMode === 'normal' && (
            <NormalModePage onResetMode={handleResetMode} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
