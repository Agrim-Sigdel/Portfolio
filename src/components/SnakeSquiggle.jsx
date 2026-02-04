import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const SnakeSquiggle = ({
    color = "var(--accent-red)",
    speed = 20,
    opacity = 0.3,
    strokeWidth = 4
}) => {
    const [path, setPath] = useState("");
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const generatePoint = () => {
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            switch (side) {
                case 0: return { x: Math.random() * window.innerWidth, y: -100 };
                case 1: return { x: window.innerWidth + 100, y: Math.random() * window.innerHeight };
                case 2: return { x: Math.random() * window.innerWidth, y: window.innerHeight + 100 };
                case 3: return { x: -100, y: Math.random() * window.innerHeight };
                default: return { x: -100, y: -100 };
            }
        };

        const start = generatePoint();
        const end = generatePoint();

        const points = [`M ${start.x} ${start.y} `];
        let currentX = start.x;
        let currentY = start.y;

        const steps = 5 + Math.floor(Math.random() * 5);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const nextX = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 500;
            const nextY = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 500;

            const cp1x = currentX + (nextX - currentX) / 2;
            const cp1y = currentY;
            const cp2x = currentX + (nextX - currentX) / 2;
            const cp2y = nextY;

            points.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextX} ${nextY} `);
            currentX = nextX;
            currentY = nextY;
        }

        setPath(points.join(" "));
        const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        setDuration(distance / (speed * 5));
    }, [speed]);

    if (!path) return null;

    return (
        <svg
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -1
            }}
        >
            <motion.path
                d={path}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                opacity={opacity}
                initial={{ pathLength: 0, pathOffset: 1 }}
                animate={{
                    pathLength: [0.1, 0.2, 0.1],
                    pathOffset: [-0.2, 1.2]
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: Math.random() * 5
                }}
            />
        </svg>
    );
};

export default SnakeSquiggle;
