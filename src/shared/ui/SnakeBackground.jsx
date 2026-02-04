import { useEffect, useRef } from 'react';
import SnakeSquiggle from './SnakeSquiggle';

const SnakeBackground = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const generateRandomSquiggles = () => {
            const squiggles = [];
            const numSquiggles = 15;

            for (let i = 0; i < numSquiggles; i++) {
                const randomDelay = Math.random() * 2;
                const randomDuration = 8 + Math.random() * 6;
                const randomSize = 100 + Math.random() * 150;

                squiggles.push({
                    id: i,
                    delay: randomDelay,
                    duration: randomDuration,
                    size: randomSize
                });
            }
            return squiggles;
        };

        const squiggles = generateRandomSquiggles();

        return () => {
            // Cleanup
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
                overflow: 'hidden'
            }}
        >
            {[...Array(15)].map((_, i) => (
                <SnakeSquiggle key={i} index={i} />
            ))}
        </div>
    );
};

export default SnakeBackground;
