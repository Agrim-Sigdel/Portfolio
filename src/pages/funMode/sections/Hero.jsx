import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Squiggle from '../../../shared/ui/Squiggle';

const Hero = () => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.5]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={sectionRef} className="hero-section" style={{ height: '150vh', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '15vh' }}>
                <motion.div style={{ scale, opacity, textAlign: 'center' }}>
                    <motion.h1
                        initial={{ clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 }}
                        animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
                        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
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
                        <motion.span
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 1, delay: 0.6 }}
                            style={{ display: 'inline-block' }}
                        >

                            Hi, I'm <span className="text-accent" style={{ fontWeight: 400, fontStyle: 'italic' }}>Agrim</span>.
                        </motion.span>
                        <br />
                        <motion.span
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 1, delay: 0.8 }}
                            style={{ display: 'inline-block' }}
                        >
                            I   <span style={{ fontStyle: 'italic', fontWeight: 400 }}>build </span>
                            things{' '}
                            <span style={{ position: 'relative', display: 'inline-block' }}>
                                that work.

                            </span>
                        </motion.span>
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
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
