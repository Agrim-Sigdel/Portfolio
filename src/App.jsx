import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from './shared/lib/ThemeContext';
import ModeSelector from './features/modeSelection/ui/ModeSelector';
import Terminal from './features/terminalMode/ui/Terminal';
import FunModePage from './pages/funMode/FunModePage';
import NormalModePage from './pages/normalMode/NormalModePage';
import './pages/funMode/funMode.css';
import './App.css';

function App() {
  const { theme } = useTheme();
  const [selectedMode, setSelectedMode] = useState(null); // null, 'fun', 'work', or 'normal'

  // Apply the theme for the active mode.
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
      // Start page (null) defaults to dark deep-space
      root.setAttribute('data-theme', 'dark');
    }
  }, [selectedMode, theme]);

  useEffect(() => {
    // Lock scrolling while the mode selector is up.
    document.body.style.overflow = selectedMode === null ? 'hidden' : 'auto';
  }, [selectedMode]);

  const handleModeSelection = (mode) => {
    // The ModeSelector plays its own glide-through-portal transition before
    // calling this, so we go straight to the page.
    setSelectedMode(mode);
  };

  const handleSwitchToFun = () => setSelectedMode('fun');
  const handleSwitchToNormal = () => setSelectedMode('normal');
  const handleResetMode = () => setSelectedMode(null);

  return (
    <div className="App">
      {/* Show mode selector first */}
      <AnimatePresence mode="wait">
        {selectedMode === null && (
          <ModeSelector onSelectMode={handleModeSelection} />
        )}
      </AnimatePresence>

      {/* Render content based on selected mode */}
      {selectedMode && (
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
