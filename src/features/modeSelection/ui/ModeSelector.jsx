import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ModeSelector.css';

export default function ModeSelector({ onSelectMode }) {
  const [selectedModule, setSelectedModule] = useState(null);

  const handleSelect = (mode) => {
    setSelectedModule(mode);
    setTimeout(() => {
      onSelectMode(mode);
    }, 800);
  };

  return (
    <div className="mode-selector-viewport">
      
      {/* Absolute Header (Fluid) */}
      <header className="ms-header">
         <h1>AGRIM SIGDEL</h1>
         <p>SELECT AN EXPERIENCE</p>
         <div className="ms-construction-badge">
           <span className="ms-construction-icon">🚧</span>
           <span className="ms-construction-text">WEBSITE UNDER CONSTRUCTION</span>
           <span className="ms-construction-icon">🚧</span>
         </div>
      </header>

      {/* Main 3D Container using CSS transforms */}
      <div className="ms-perspective-container">
        <motion.div 
          className="ms-clay-backboard"
          initial={{ y: 20, opacity: 0, rotateX: 5, rotateY: -10 }}
          animate={{ y: 0, opacity: 1, rotateX: 5, rotateY: -10 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Decorative Window Controls */}
          <div className="ms-controls">
            <span className="ms-dot white" />
            <span className="ms-dot purple" />
            <span className="ms-dot purple" />
          </div>

          <div className="ms-cards-grid">
            
            {/* NORMAL MODE CARD */}
            <motion.div 
              className="ms-card"
              initial={{ y: 0 }}
              whileHover={{ y: -15, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect('normal')}
            >
               <div className="ms-card-top-dots">
                 <div className="ms-dot orange" /><div className="ms-dot orange" />
               </div>
               
               <div className="ms-icon-ab-container">
                 <div className="ms-ab-circle"></div>
                 <h2>Ab</h2>
               </div>
               <div className="ms-line medium" />
               <div className="ms-line short" />
               
               <div className="ms-user-icon">
                 <div className="ms-head"></div>
                 <div className="ms-shoulders"></div>
               </div>

               <div className="ms-label">NORMAL MODE</div>
            </motion.div>

            {/* FUN MODE CARD */}
            <motion.div 
              className="ms-card"
              style={{ marginTop: window.innerWidth > 800 ? 30 : 0 }}
              initial={{ y: 0 }}
              whileHover={{ y: -15, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect('fun')}
            >
               <div className="ms-card-top-dots">
                 <div className="ms-dot orange" /><div className="ms-dot orange" />
               </div>

               <div className="ms-pie-row">
                 <div className="ms-pie-chart">
                   <div className="ms-pie-inner"></div>
                 </div>
                 <div className="ms-pie-lines">
                   <div className="ms-line short" />
                   <div className="ms-line short" />
                 </div>
               </div>

               <div className="ms-play-box">
                 <div className="ms-play-triangle">▶</div>
               </div>

               <div className="ms-label">FUN MODE</div>
            </motion.div>

            {/* WORK MODE CARD */}
            <motion.div 
              className="ms-card"
              initial={{ y: 0 }}
              whileHover={{ y: -15, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect('work')}
            >
               <div className="ms-card-top-dots">
                 <div className="ms-dot orange" /><div className="ms-dot orange" />
               </div>

               <div className="ms-question-mark">?</div>

               <div className="ms-label">WORK MODE</div>
            </motion.div>

          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedModule && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ms-transition-overlay"
          >
            <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="ms-transition-text"
            >
               INITIALIZING {selectedModule.toUpperCase()}...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}