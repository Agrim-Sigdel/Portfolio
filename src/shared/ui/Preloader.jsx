import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = ({ onComplete }) => {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPercentage((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 1000); // Wait 1s after hitting 100
                    return 100;
                }
                // Random increments for a more organic feel
                const increment = Math.floor(Math.random() * 5) + 1;
                return Math.min(prev + increment, 100);
            });
        }, 30);

        return () => clearInterval(interval);
    }, [onComplete]);

    const words = ["Innovation", "Design", "AI", "Precision", "Agrim Sigdel"];
    const currentWordIndex = Math.min(Math.floor((percentage / 100) * words.length), words.length - 1);

    return (
        <motion.div
            className="preloader"
            initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 1.2, ease: [0.77, 0, 0.175, 1] } }}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#0b0b0b',
                zIndex: 10000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff',
                fontFamily: 'var(--font-serif)',
                flexDirection: 'column'
            }}
        >
            <div style={{ position: 'relative', overflow: 'hidden', height: '1.2em', marginBottom: '1rem' }}>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={words[currentWordIndex]}
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        style={{ display: 'block', fontSize: '1.2rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '4px', color: '#fff' }}
                    >
                        {words[currentWordIndex]}
                    </motion.span>
                </AnimatePresence>
            </div>

            <motion.h1
                style={{
                    fontSize: 'clamp(4rem, 15vw, 12rem)',
                    fontWeight: '900',
                    margin: 0,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#fff'
                }}
            >
                {percentage}%
            </motion.h1>

            <div style={{
                position: 'absolute',
                bottom: '4rem',
                left: '4vw',
                fontSize: '0.8rem',
                opacity: 0.4,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#fff'
            }}>
                © 2026 Portfolio Original
            </div>
        </motion.div>
    );
};

export default Preloader;
