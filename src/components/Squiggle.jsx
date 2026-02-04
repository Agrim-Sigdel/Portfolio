import { motion } from 'framer-motion';

const Squiggle = ({
    path = "M10 30C40 10 70 30 100 10C130 -10 160 30 190 20",
    width = "400",
    height = "100",
    viewBox = "0 0 400 100",
    strokeColor = "var(--accent-red)",
    strokeWidth = "10",
    duration = 1.5,
    delay = 1,
    style = {},
    animateType = "draw"
}) => {

    const variants = {
        draw: {
            pathLength: [0, 1],
            transition: { duration, delay, ease: "easeInOut" }
        },
        float: {
            y: [0, -10, 0],
            rotate: [0, 2, -2, 0],
            transition: {
                duration: duration * 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        },
        pulse: {
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.6, 0.3],
            transition: {
                duration: duration * 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <svg
            width={width}
            height={height}
            viewBox={viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: -1,
                ...style
            }}
        >
            <motion.path
                d={path}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={animateType === "draw" ? { pathLength: 0 } : {}}
                animate={variants[animateType]}
            />
        </svg>
    );
};

export default Squiggle;
