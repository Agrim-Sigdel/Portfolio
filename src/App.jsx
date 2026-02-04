import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WorkGrid from './components/WorkGrid';
import Process from './components/Process';
import About from './components/About';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import TickerSection from './components/TickerSection';
import ModeSelector from './components/ModeSelector';
import Terminal from './components/work/Terminal';
import NormalMode from './components/NormalMode';
import ReturnToStartButton from './components/ReturnToStartButton';
import { AnimatePresence, motion } from 'framer-motion';
import SnakeBackground from './components/SnakeBackground';

function App() {
  const [selectedMode, setSelectedMode] = useState(null); // null, 'fun', or 'work'
  const [isLoading, setIsLoading] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);

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
          {/* FUN MODE - Current modern website */}
          {selectedMode === 'fun' && (
            <>
              <CustomCursor />
              <SnakeBackground />
              <ReturnToStartButton onResetMode={handleResetMode} />
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
              >
                <Navbar />
                <Hero />
                <About />
                <TickerSection />
                <WorkGrid />
                <Process />
                <Footer onResetMode={handleResetMode} />
              </motion.div>
            </>
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
          {selectedMode === 'normal' && <NormalMode onResetMode={handleResetMode} />}
        </>
      )}
    </div>
  );
}

export default App;
