import React, { useRef } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import Ticker from './Ticker';

const TickerSection = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Map scroll progress to a movement range
    // When progress is 0.5 (center of viewport), offset will be 0
    const moveLeft = useTransform(scrollYProgress, [0, 1], [300, -300]);
    const moveRight = useTransform(scrollYProgress, [0, 1], [-300, 300]);

    const lines = [
        { text: "Developement", offset: moveLeft },  // Line 1: Left
        { text: "Design", offset: moveRight },   // Line 2: Right
        { text: "Ai/Ml", offset: moveLeft },   // Line 3: Left
        { text: "Computer Science", offset: moveRight },   // Line 4: Right
    ];

    return (
        <section
            ref={containerRef}
            className="ticker-section"
            style={{
                padding: '10rem 0',
                backgroundColor: 'var(--bg-black)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}
        >
            {lines.map((line, index) => (
                <Ticker
                    key={index}
                    className={`ticker-line ticker-${index}`}
                    items={[
                        <span style={{
                            fontSize: 'clamp(4rem, 12vw, 10rem)',
                            fontWeight: '900',
                            fontFamily: 'var(--font-serif)',
                            textTransform: 'uppercase',
                            color: index % 2 === 0 ? 'var(--text-cream)' : 'transparent',
                            WebkitTextStroke: index % 2 === 0 ? 'none' : '1px var(--text-muted)',
                            opacity: 0.8
                        }}>
                            {line.text}
                        </span>
                    ]}
                    offset={line.offset}
                    speed={1}
                />
            ))}
        </section>
    );
};

export default TickerSection;
