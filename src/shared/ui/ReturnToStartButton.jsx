import { useState } from 'react';

const ReturnToStartButton = ({ onResetMode }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onResetMode}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-cursor="Home"
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 999,
                background: 'transparent',
                border: `2px solid ${isHovered ? 'var(--accent-red)' : 'var(--text-muted)'}`,
                color: isHovered ? 'var(--accent-red)' : 'var(--text-muted)',
                padding: '0.8rem 1.5rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}
        >
            ↩ Back
        </button>
    );
};

export default ReturnToStartButton;
