import React, { useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import './ModeSelector.css';

const AVAILABLE_MODES = {
    fun: true,
    work: true,
    normal: true
};

// Icon components
const RocketIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
);

const BriefcaseIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const LayoutIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
);

const ArrowIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
);

const iconMap = {
    rocket: RocketIcon,
    briefcase: BriefcaseIcon,
    layout: LayoutIcon
};

const modeOptions = [
    {
        id: 'fun',
        label: 'Fun Mode',
        description: 'Interactive & Playful',
        stat: 'Creative',
        statLabel: 'experience',
        icon: 'rocket',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        id: 'work',
        label: 'Work Mode',
        description: 'Professional Portfolio',
        stat: 'Terminal',
        statLabel: 'interface',
        icon: 'briefcase',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
        id: 'normal',
        label: 'Normal Mode',
        description: 'Clean & Simple',
        stat: 'Classic',
        statLabel: 'layout',
        icon: 'layout',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
];

const ModeSelector = ({ onSelectMode }) => {
    const [transitionMode, setTransitionMode] = useState(null);
    const [isSwitching, setIsSwitching] = useState(false);
    const switchTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (switchTimeoutRef.current) {
                window.clearTimeout(switchTimeoutRef.current);
            }
        };
    }, []);

    const handleModeClick = (mode) => {
        if (isSwitching || !AVAILABLE_MODES[mode]) {
            return;
        }

        setTransitionMode(mode);
        setIsSwitching(true);

        switchTimeoutRef.current = window.setTimeout(() => {
            onSelectMode(mode);
        }, 520);
    };

    return (
        <div className="mode-selector-page">
            <div className="mode-selector-container">
                <Motion.div
                    className="mode-content-wrapper"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Title */}
                    <Motion.h1
                        className="mode-page-title"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        Choose Your Experience
                    </Motion.h1>

                    {/* Cards Grid */}
                    <div className="mode-cards-grid">
                        {modeOptions.map((mode, index) => {
                            const ModeIcon = iconMap[mode.icon];

                            return (
                                <Motion.div
                                    key={mode.id}
                                    className="mode-option-card"
                                    onClick={() => handleModeClick(mode.id)}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                >
                                    <div
                                        className="mode-card-visual"
                                        style={{ background: mode.gradient }}
                                    >
                                        <div className="mode-card-icon-wrapper">
                                            <ModeIcon />
                                        </div>
                                        <div className="mode-card-stat">
                                            <div className="mode-stat-number">{mode.stat}</div>
                                            <div className="mode-stat-label">{mode.statLabel}</div>
                                        </div>
                                    </div>
                                    <div className="mode-card-footer">
                                        <div className="mode-card-info">
                                            <h3 className="mode-card-label">{mode.label}</h3>
                                            <p className="mode-card-description">{mode.description}</p>
                                        </div>
                                        <div className="mode-card-arrow">
                                            <ArrowIcon />
                                        </div>
                                    </div>
                                </Motion.div>
                            );
                        })}
                    </div>

                    {/* Large Background Text */}
                    <div className="mode-background-text">
                        Portfolio
                    </div>

                    {/* Footer */}
                    <Motion.footer
                        className="mode-page-footer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <div className="mode-footer-content">
                            <div className="mode-footer-left">
                                <p>© 2024 Agrim Sigdel. All rights reserved.</p>
                            </div>
                            <div className="mode-footer-right">
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
                            </div>
                        </div>
                    </Motion.footer>
                </Motion.div>
            </div>
        </div>
    );
};

export default ModeSelector;
