import React from 'react';
import { motion, useTransform } from 'framer-motion';

const Ticker = ({ items, className, offset, speed = 1 }) => {
    // Transform the scroll offset into a pixel value for translation
    const x = useTransform(offset, (val) => `${val * speed}px`);

    return (
        <div
            className={className}
            style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                display: 'flex',
                justifyContent: 'center', // Center the ticker container content
                width: '100%'
            }}
        >
            <motion.div
                style={{
                    x,
                    display: 'flex',
                    gap: '4rem', // Slightly larger gap for better spacing
                    width: 'max-content'
                }}
            >
                {/* Render items multiple times for continuity, but keep it centered initially */}
                {[...Array(6)].map((_, i) => (
                    <React.Fragment key={i}>
                        {items.map((item, index) => (
                            <div key={index} style={{ flexShrink: 0 }}>
                                {item}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    );
};

export default Ticker;
