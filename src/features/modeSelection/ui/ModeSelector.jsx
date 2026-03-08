import React, { useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import './ModeSelector.css';

const ModeSelector = ({ onSelectMode }) => {
    const [ripples, setRipples] = useState([]);
    const [transitionMode, setTransitionMode] = useState(null);
    const [isSwitching, setIsSwitching] = useState(false);
    const lastRippleAtRef = useRef(0);
    const switchTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (switchTimeoutRef.current) {
                window.clearTimeout(switchTimeoutRef.current);
            }
        };
    }, []);

    const handleModeClick = (mode) => {
        if (isSwitching) {
            return;
        }

        setTransitionMode(mode);
        setIsSwitching(true);

        switchTimeoutRef.current = window.setTimeout(() => {
            onSelectMode(mode);
        }, 520);
    };

    const handlePointerMove = (event) => {
        const now = performance.now();
        if (now - lastRippleAtRef.current < 90) {
            return;
        }

        const newRipple = {
            id: `${now}-${Math.random()}`,
            x: event.clientX,
            y: event.clientY
        };

        lastRippleAtRef.current = now;

        setRipples((prev) => {
            const next = [...prev, newRipple];
            return next.length > 14 ? next.slice(next.length - 14) : next;
        });

        window.setTimeout(() => {
            setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
        }, 900);
    };

    return (
        <Motion.div
            className={`mode-selector ${transitionMode ? `mode-${transitionMode}` : ''} ${isSwitching ? 'is-switching' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onMouseMove={handlePointerMove}
        >
            <div className="tape-rolling-bg" aria-hidden="true">
                <div className="tape-rolling-reel tape-rolling-reel-left"><span></span></div>
                <div className="tape-rolling-path tape-rolling-path-top"></div>
                <div className="tape-rolling-path tape-rolling-path-bottom"></div>
                <div className="tape-rolling-wrap tape-rolling-wrap-left"></div>
                <div className="tape-rolling-wrap tape-rolling-wrap-right"></div>
                <div className="tape-rolling-reel tape-rolling-reel-right"><span></span></div>
            </div>

            <div className="mode-selector-ripple-layer" aria-hidden="true">
                {ripples.map((ripple) => (
                    <span
                        key={ripple.id}
                        className="mode-selector-ripple"
                        style={{
                            left: `${ripple.x}px`,
                            top: `${ripple.y}px`
                        }}
                    />
                ))}
            </div>

            <div className="mode-selector-content">
                <Motion.p
                    className="mode-selector-kicker"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                   Agrim Sigdel - Portfolio
                </Motion.p>

                <Motion.h1
                    className="mode-selector-title"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                    Pick Your Experience
                </Motion.h1>
{/* 
                <motion.p
                    className="mode-selector-subtitle"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    Choose a mode and dive in.
                </motion.p>

                <motion.div
                    className="mode-info-strip"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                >
                    <span><strong>FUN</strong> — animated</span>
                    <span><strong>WORK</strong> — terminal</span>
                    <span><strong>NORMAL</strong> — clean</span>
                </motion.div> */}

                <div className="mode-buttons">
                    <Motion.button
                        className="mode-button fun-button"
                        onClick={() => handleModeClick('fun')}
                        disabled={isSwitching}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="mode-button-label">FUN</span>
                        <span className="mode-button-reels" aria-hidden="true"><span></span><span></span></span>
                        <span className="mode-button-cta">Click here</span>
                        <span className="mode-button-desc">Visual & interactive</span>
                    </Motion.button>

                    <Motion.button
                        className="mode-button work-button"
                        onClick={() => handleModeClick('work')}
                        disabled={isSwitching}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="mode-button-label">WORK</span>
                        <span className="mode-button-reels" aria-hidden="true"><span></span><span></span></span>
                        <span className="mode-button-desc">Terminal focused</span>
                    </Motion.button>

                    <Motion.button
                        className="mode-button normal-button"
                        onClick={() => handleModeClick('normal')}
                        disabled={isSwitching}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="mode-button-label">NORMAL</span>
                        <span className="mode-button-reels" aria-hidden="true"><span></span><span></span></span>
                        <span className="mode-button-desc">Quick and clean</span>
                    </Motion.button>
                </div>
            </div>
        </Motion.div>
    );
};

export default ModeSelector;
