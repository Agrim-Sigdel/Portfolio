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
    const [points, setPoints] = useState([]);

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

        const pathPoints = [`M ${start.x} ${start.y} `];
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

            pathPoints.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextX} ${nextY} `);
            currentX = nextX;
            currentY = nextY;
        }

        setPath(pathPoints.join(" "));
        const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        setDuration(distance / (speed * 5));
    }, [speed]);

    if (!path) return null;

    const dotCount = 12;

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
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {[...Array(dotCount)].map((_, i) => (
                <motion.circle
                    key={i}
                    r={strokeWidth / 2}
                    fill={color}
                    opacity={opacity}
                    style={{
                        filter: 'url(#glow)',
                    }}
                    initial={{ offsetDistance: "0%", scale: 0 }}
                    animate={{
                        offsetDistance: ["0%", "100%"],
                        scale: [0, 1, 1, 0],
                        y: [0, -10, 0] // Added a small bounce
                    }}
                    transition={{
                        offsetDistance: {
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: (i * 0.1) + (Math.random() * 2)
                        },
                        scale: {
                            duration: duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: (i * 0.1) + (Math.random() * 2)
                        },
                        y: {
                            duration: 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }
                    }}
                >
                    <animateMotion
                        path={path}
                        dur={`${duration}s`}
                        repeatCount="indefinite"
                        begin={`${i * 0.15}s`}
                    />
                </motion.circle>
            ))}
        </svg>
    );
};

export default SnakeSquiggle;
