import SnakeSquiggle from './SnakeSquiggle';

const SnakeBackground = () => {
    const snakes = [
        { color: "var(--accent-red)", speed: 12, opacity: 0.2, strokeWidth: 8 },
        { color: "var(--text-muted)", speed: 20, opacity: 0.1, strokeWidth: 4 },
        { color: "var(--accent-red)", speed: 8, opacity: 0.15, strokeWidth: 12 },
        { color: "var(--text-cream)", speed: 15, opacity: 0.08, strokeWidth: 3 },
        { color: "var(--accent-red)", speed: 18, opacity: 0.12, strokeWidth: 5 },
        { color: "var(--text-muted)", speed: 10, opacity: 0.05, strokeWidth: 15 },
        { color: "var(--text-cream)", speed: 14, opacity: 0.1, strokeWidth: 4 },
        { color: "var(--accent-red)", speed: 25, opacity: 0.07, strokeWidth: 2 },
        { color: "var(--text-muted)", speed: 6, opacity: 0.1, strokeWidth: 20 },
        { color: "var(--text-cream)", speed: 20, opacity: 0.06, strokeWidth: 6 },
        { color: "var(--accent-red)", speed: 14, opacity: 0.15, strokeWidth: 10 },
        { color: "var(--text-muted)", speed: 22, opacity: 0.08, strokeWidth: 3 },
        { color: "var(--accent-red)", speed: 10, opacity: 0.1, strokeWidth: 7 },
        { color: "var(--text-cream)", speed: 16, opacity: 0.05, strokeWidth: 5 },
        { color: "var(--accent-red)", speed: 30, opacity: 0.1, strokeWidth: 2 },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}>
            {snakes.map((snake, index) => (
                <SnakeSquiggle key={index} {...snake} />
            ))}
        </div>
    );
};

export default SnakeBackground;
