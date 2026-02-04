import React from 'react';

const ReturnToStartButton = ({ onResetMode }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [scrollY, setScrollY] = React.useState(0);

    React.useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Calculate total scrollable height
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Calculate scroll progress (0 to 1)
    const scrollProgress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

    // Calculate position within the VIEWPORT (visible screen area)
    // Move from top-left to bottom-right of viewport at 45 degrees
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Start position: top-left (1.5rem from edges)
    // End position: bottom-right (1.5rem from edges)
    const startLeft = 24; // 1.5rem in pixels
    const startTop = 80; // 5rem in pixels (below navbar)
    const endLeft = viewportWidth - 150; // Leave space for button width
    const endTop = viewportHeight - 60; // Leave space for button height

    // Interpolate position based on scroll
    const left = startLeft + (scrollProgress * (endLeft - startLeft));
    const top = startTop + (scrollProgress * (endTop - startTop));

    const opacity = isHovered ? 1 : (scrollY > 100 ? 0.15 : 0.4);

    return (
        <button
            onClick={onResetMode}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 999999,
                background: isHovered ? 'var(--accent-red)' : 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '2px solid var(--accent-red)',
                color: isHovered ? '#000' : 'var(--accent-red)',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                borderRadius: '1.5rem',
                transition: 'all 0.3s ease, opacity 0.5s ease',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                boxShadow: isHovered
                    ? '0 6px 30px rgba(255, 76, 43, 0.5)'
                    : '0 4px 20px rgba(0, 0, 0, 0.3)',
                WebkitBackdropFilter: 'blur(10px)',
                opacity: opacity,
            }}
        >
            ↩ start
        </button>
    );
};

export default ReturnToStartButton;
