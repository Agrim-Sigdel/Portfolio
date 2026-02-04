import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../lib/ThemeContext';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <motion.button
            onClick={toggleTheme}
            className="theme-toggle"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            data-cursor={isDark ? 'Light Mode' : 'Dark Mode'}
            style={{
                position: 'fixed',
                top: '2rem',
                right: '2rem',
                zIndex: 500,
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: '2px solid var(--accent-red)',
                background: 'var(--bg-panel)',
                color: 'var(--accent-red)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                transition: 'all 0.3s ease',
                padding: 0
            }}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
            {isDark ? <MdLightMode /> : <MdDarkMode />}
        </motion.button>
    );
};

export default ThemeToggle;
