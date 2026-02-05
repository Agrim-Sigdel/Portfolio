import React from 'react';
import { motion } from 'framer-motion';
import './ModeSelector.css';

const ModeSelector = ({ onSelectMode }) => {
    return (
        <motion.div
            className="mode-selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mode-selector-content">
                <motion.h1
                    className="mode-selector-title"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                   Welcome
                </motion.h1>

                <motion.p
                    className="mode-selector-subtitle"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    How would you like to explore?
                </motion.p>

                <div className="mode-buttons">
                    <motion.button
                        className="mode-button fun-button"
                        onClick={() => onSelectMode('fun')}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="mode-button-label">FUN</span>
                        <span className="mode-button-desc">Modern & Interactive</span>
                    </motion.button>

                    <motion.button
                        className="mode-button work-button"
                        onClick={() => onSelectMode('work')}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="mode-button-label">Old</span>
                        <span className="mode-button-desc">Terminal Interface</span>
                    </motion.button>

                    <motion.button
                        className="mode-button normal-button"
                        onClick={() => onSelectMode('normal')}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="mode-button-label">NORMAL</span>
                        <span className="mode-button-desc">Clean & Simple</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default ModeSelector;
