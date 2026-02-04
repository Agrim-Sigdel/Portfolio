import { motion } from 'framer-motion';

// Hand-drawn squiggle SVG
const Squiggle = () => (
    <svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: '-20px', right: '-10px', zIndex: -1 }}>
        <motion.path
            d="M10 30C40 10 70 30 100 10C130 -10 160 30 190 20"
            stroke="var(--accent-red)"
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
        />
    </svg>
);

const Hero = () => {
    return (
        <section className="hero-section">
            <motion.h1
                initial={{ clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    fontSize: 'clamp(3.5rem, 9vw, 8.5rem)',
                    lineHeight: '0.95',
                    maxWidth: '1200px',
                    fontFamily: 'var(--font-serif)',
                    fontWeight: '900',
                    letterSpacing: '-0.04em',
                    margin: '0 auto'
                }}
            >
                Hi, I’m <span className="text-accent" style={{ fontWeight: 400, fontStyle: 'italic' }}>Agrim</span>. <br />
                I <span style={{ fontStyle: 'italic', fontWeight: 400 }}>build</span> things{' '}
                <span style={{ position: 'relative', display: 'inline-block' }}>
                    that work.
                    <Squiggle />
                </span>
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                style={{
                    marginTop: '4rem',
                    maxWidth: '600px',
                    color: 'var(--text-muted)',
                    fontSize: '1.25rem',
                    fontWeight: '400',
                    lineHeight: '1.6',
                    margin: '4rem auto 0'
                }}
            >
                Full-Stack Developer focused on <span style={{ color: 'var(--text-cream)' }}>AI Innovation</span> and building production-ready code with React, TypeScript, and Python.
                <br />
                <span style={{ fontSize: '1rem', marginTop: '1.5rem', display: 'block', opacity: 0.8, fontWeight: '500' }}>
                    Specializing in <span className="text-accent">Computer Vision</span> and <span className="text-accent">NLP</span> model integration.
                </span>
            </motion.p>
        </section>
    );
};

export default Hero;
