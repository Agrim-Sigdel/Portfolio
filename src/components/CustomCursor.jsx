import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
    const [cursorText, setCursorText] = useState('');
    const [isHovering, setIsHovering] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

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
                        x: '10px',
                        y: '10px'
                    }}
                >
                    <img
                        src="/kurama-pointer.png"
                        alt="trail"
                        style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                    />
                </motion.div>

                {/* Dynamic Text Label */}
                {cursorText && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            position: 'absolute',
                            left: trailX,
                            top: trailY,
                            x: '45px',
                            y: '0px',
                            backgroundColor: 'white',
                            color: 'black',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
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
