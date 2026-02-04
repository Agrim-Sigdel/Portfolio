import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
    const [cursorText, setCursorText] = useState('');
    const [isHovering, setIsHovering] = useState(false);
    
    // Trail settings
    const TRAIL_LENGTH = 20;
    const trailRef = useRef(Array(TRAIL_LENGTH).fill({ x: -100, y: -100 }));
    const dotsRef = useRef([]);

    // Initialize cursor after "Agrim" ends
    const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 + 180 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight * 0.18 : 0;

    const mouseX = useMotionValue(initialX);
    const mouseY = useMotionValue(initialY);

    // Smooth springs for the main cursor dot
    const springConfig = { damping: 25, stiffness: 700 };
    const dotX = useSpring(mouseX, springConfig);
    const dotY = useSpring(mouseY, springConfig);

    useEffect(() => {
        // Initialize trail positions to the starting position
        trailRef.current = Array(TRAIL_LENGTH).fill({ x: initialX, y: initialY });
        
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            mouseX.set(clientX);
            mouseY.set(clientY);

            // Update trail data
            // Shift all points down and add new one at the end
            // We want the last element to be the "head" (newest) and 0 to be tail (oldest)
            const currentTrail = trailRef.current;
            currentTrail.shift();
            currentTrail.push({ x: clientX, y: clientY });
            
            // Update DOM directly for performance
            dotsRef.current.forEach((dot, index) => {
                if (dot) {
                    const point = currentTrail[index];
                    dot.style.left = `${point.x}px`;
                    dot.style.top = `${point.y}px`;
                    // Opacity decreasing for older points
                    // index 0 is oldest (tail), index length-1 is newest (head)
                    // We want tail to fade out.
                    const opacity = (index + 1) / TRAIL_LENGTH; 
                    dot.style.opacity = opacity * 0.6; // Max opacity 0.6
                }
            });
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
    }, [mouseX, mouseY, initialX, initialY]);

    return (
        <>
            <style>{`
        * { cursor: none !important; }
        @media (max-width: 768px) {
          .custom-cursor-container { display: none; }
          * { cursor: auto !important; }
        }
        .cursor-trail-dot {
            position: absolute;
            width: 16px;
            height: 16px;
            background-color: #ff0000;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            transition: opacity 0.1s ease;
        }
      `}</style>

            <div className="custom-cursor-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
                {/* Snake Trail */}
                {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
                    <div
                        key={i}
                        ref={el => dotsRef.current[i] = el}
                        className="cursor-trail-dot"
                        style={{
                            left: initialX, // Initial position
                            top: initialY,
                            opacity: (i + 1) / TRAIL_LENGTH * 0.6,
                             // Newer dots are smaller? Or same size? Let's make tail smaller
                            transform: `translate(-50%, -50%) scale(${(i + 5) / (TRAIL_LENGTH + 5)})` 
                        }}
                    />
                ))}

                {/* Main Dot */}
                <motion.div
                    style={{
                        position: 'absolute',
                        left: dotX,
                        top: dotY,
                        width: 12,
                        height: 12,
                        backgroundColor: '#ff0000',
                        borderRadius: '50%',
                        x: '-50%',
                        y: '-50%',
                        boxShadow: '0 0 10px #ff0000'
                    }}
                />

                {/* Text Label */}
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            left: dotX,
                            top: dotY,
                            x: '-50%',
                            y: 'calc(-50% + 20px)',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            color: '#ff0000',
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
