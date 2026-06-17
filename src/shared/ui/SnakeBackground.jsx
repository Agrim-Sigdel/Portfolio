import { useRef } from 'react';
import SnakeSquiggle from './SnakeSquiggle';

const SnakeBackground = () => {
    const containerRef = useRef(null);

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
                <SnakeSquiggle key={i} />
            ))}
        </div>
    );
};

export default SnakeBackground;
