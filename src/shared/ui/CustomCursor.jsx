import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
    const [cursorText, setCursorText] = useState('');
    const [isHovering, setIsHovering] = useState(false);

    // Initialize cursor after "Agrim" ends, between navbar and the name
    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 + 180 : 0; // Further to the right
    const initialY = typeof window !== 'undefined' ? window.innerHeight * 0.18 : 0; // Between navbar and name

    const mouseX = useMotionValue(initialX);
    const mouseY = useMotionValue(initialY);

    // Smooth springs for the cursor dot
    const springConfig = { damping: 25, stiffness: 700 };
    const dotX = useSpring(mouseX, springConfig);
    const dotY = useSpring(mouseY, springConfig);

    // Lagging springs for the unicorn and text
    const trailConfig = { damping: 40, stiffness: 400 };
    const trailX = useSpring(mouseX, trailConfig);
    const trailY = useSpring(mouseY, trailConfig);

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
                {/* Main Dot */}
                <motion.div
                    style={{
                        position: 'absolute',
                        left: dotX,
                        top: dotY,
                        width: 8,
                        height: 8,
                        backgroundColor: 'var(--accent-red)',
                        borderRadius: '50%',
                        x: '-50%',
                        y: '-50%'
                    }}
                />

                {/* Trailing Unicorn character */}
                <motion.div
                    style={{
                        position: 'absolute',
                        left: trailX,
                        top: trailY,
                        fontSize: '1.5rem',
                        x: '-50%',
                        y: '-50%',
                        opacity: isHovering ? 1 : 0.3,
                        transition: 'opacity 0.3s ease'
                    }}
                >
                    ✨
                </motion.div>

                {/* Text Label */}
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            left: trailX,
                            top: trailY,
                            x: '-50%',
                            y: 'calc(-50% + 20px)',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            color: 'var(--accent-red)',
                            whiteSpace: 'nowrap'
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
