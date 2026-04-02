import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
    const [cursorText, setCursorText] = useState('');
    const [isHovering, setIsHovering] = useState(false);

    // Initial position
    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

    const mouseX = useMotionValue(initialX);
    const mouseY = useMotionValue(initialY);

    // Fast spring for inner dot
    const dotX = useSpring(mouseX, { damping: 30, stiffness: 800, mass: 0.5 });
    const dotY = useSpring(mouseY, { damping: 30, stiffness: 800, mass: 0.5 });

    // Slower spring for outer ring to create a trailing smooth effect
    const ringX = useSpring(mouseX, { damping: 40, stiffness: 300, mass: 1 });
    const ringY = useSpring(mouseY, { damping: 40, stiffness: 300, mass: 1 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        const handleMouseOver = (e) => {
            const target = e.target.closest('[data-cursor]');
            if (target) {
                setCursorText(target.getAttribute('data-cursor'));
                setIsHovering(true);
            } else {
                setIsHovering(false);
                setCursorText('');
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
             window.removeEventListener('mousemove', handleMouseMove);
             window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [mouseX, mouseY]);

    return (
        <>
            <style>{`
                * { cursor: none !important; }
                @media (max-width: 768px) {
                    .custom-cursor-container { display: none; }
                    * { cursor: auto !important; }
                }
            `}</style>

            <div className="custom-cursor-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
                
                {/* Outer Trailing Ring */}
                <motion.div
                    style={{
                        position: 'absolute',
                        left: ringX,
                        top: ringY,
                        x: '-50%',
                        y: '-50%',
                        width: isHovering ? 60 : 36,
                        height: isHovering ? 60 : 36,
                        border: '2px solid var(--accent-red)',
                        borderRadius: '50%',
                        opacity: isHovering ? 0 : 0.4,
                        transition: 'width 0.2s ease, height 0.2s ease, opacity 0.2s ease'
                    }}
                />

                {/* Main Inner Dot */}
                <motion.div
                    style={{
                        position: 'absolute',
                        left: dotX,
                        top: dotY,
                        width: isHovering ? 4 : 8,
                        height: isHovering ? 4 : 8,
                        backgroundColor: 'var(--accent-red)',
                        borderRadius: '50%',
                        x: '-50%',
                        y: '-50%',
                        boxShadow: '0 0 10px var(--accent-red)',
                        transition: 'width 0.2s ease, height 0.2s ease'
                    }}
                />

                {/* Text Label */}
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'absolute',
                            left: dotX,
                            top: dotY,
                            x: '15px',
                            y: '-50%',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            color: 'var(--accent-red)',
                            whiteSpace: 'nowrap',
                            background: 'var(--bg-black)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            border: '1px solid var(--accent-red)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}
                    >
                        {cursorText}
                    </motion.div>
                )}
            </div>
        </>
    );
};

export default CustomCursor;
