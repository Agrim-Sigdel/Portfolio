import { motion } from 'framer-motion';

const SnakeSquiggle = ({ index }) => {
    const randomDelay = Math.random() * 2;
    const randomDuration = 8 + Math.random() * 6;
    const randomSize = 100 + Math.random() * 150;
    const randomXStart = Math.random() * window.innerWidth;

    return (
        <motion.svg
            style={{
                position: 'absolute',
                left: randomXStart,
                top: -randomSize,
                opacity: 0.05,
                pointerEvents: 'none'
            }}
            width={randomSize}
            height={randomSize}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{
                y: window.innerHeight + randomSize + 100,
                rotate: 360
            }}
            transition={{
                duration: randomDuration,
                delay: randomDelay,
                repeat: Infinity,
                ease: 'linear'
            }}
        >
            <path
                d="M 50 10 Q 30 30, 50 50 T 50 90"
                stroke="var(--accent-red)"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </motion.svg>
    );
};

export default SnakeSquiggle;
