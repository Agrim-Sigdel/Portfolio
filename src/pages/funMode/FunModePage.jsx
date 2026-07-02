import React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import Navbar from '../../widgets/header/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import WorkGrid from './sections/WorkGrid';
import Experience from './sections/Experience';
import Research from './sections/Research';
import Process from './sections/Process';
import Footer from './sections/Footer';
import TickerSection from './sections/TickerSection';
import ReturnToStartButton from '../../shared/ui/ReturnToStartButton';
import SEO from '../../shared/ui/SEO';
import content from '../../data/content.json';
import { ScrollContainerContext } from './ScrollContainerContext';
import './funMode.css'; // Add a CSS file reference if needed, assuming it's loaded globally usually

// The tilt only makes sense with a fine pointer: with no mouse the page would
// rest permanently skewed (rotateX 12° / rotateY -20°), clipped at the edges.
const canTilt = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A component that wraps its children in a mouse-responsive 3D tilt.
// The scroll container ref is owned by the page so the (viewport-fixed) Navbar
// can live OUTSIDE the transformed subtree — transforms break position:fixed.
const TiltPresentationWrapper = ({ children, containerRef }) => {
    const [tiltEnabled] = React.useState(canTilt);
    const { scrollY } = useScroll({ container: containerRef });

    // Track mouse to generate base tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { damping: 30, stiffness: 100 });
    const smoothY = useSpring(mouseY, { damping: 30, stiffness: 100 });

    const handleMouseMove = (e) => {
        if (!tiltEnabled) return;
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    // calculate final rotations matching mouse position, but fading out as we scroll down
    const rotateX = useTransform([smoothY, scrollY], ([y, scroll]) => {
        if (!tiltEnabled) return 0;
        const baseTilt = 12 - (y / 800) * 8; // approx 12 to 4 degrees
        const fade = Math.max(0, 1 - (scroll / 400)); // fades to 0 linearly by 400px scroll
        return baseTilt * fade;
    });

    const rotateY = useTransform([smoothX, scrollY], ([x, scroll]) => {
        if (!tiltEnabled) return 0;
        const baseTilt = -20 - (x / 1400) * -10; // approx -20 to -10 degrees
        const fade = Math.max(0, 1 - (scroll / 400));
        return baseTilt * fade;
    });

    return (
        <div
            style={{
                width: '100vw',
                height: '100dvh',
                perspective: '1500px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0e1215 0%, #163632 100%)'
            }}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                ref={containerRef}
                style={{
                    width: '100vw',
                    height: '100dvh',
                    rotateX,
                    rotateY,
                    rotateZ: 0,
                    transformStyle: tiltEnabled ? 'preserve-3d' : 'flat',
                    transformOrigin: 'center center',
                    // shadow/radius only earn their compositing cost while tilted
                    boxShadow: tiltEnabled ? '-40px 40px 100px rgba(0,0,0,0.8)' : 'none',
                    borderRadius: tiltEnabled ? '20px' : 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    background: 'var(--bg-color)',
                    transition: 'border-radius 0.3s ease'
                }}
                className="fun-mode-tilted-content"
            >
                {children}
            </motion.div>
        </div>
    );
};

const FunModePage = ({ onResetMode }) => {
    const scrollContainerRef = React.useRef(null);

    return (
        <ScrollContainerContext.Provider value={scrollContainerRef}>
            <SEO
                title={`${content.common.personal.name} - Portfolio`}
                description={content.common.personal.shortSummary || content.common.personal.summary}
                url="https://agrimsigdel.com.np/normal"
            />
            <ReturnToStartButton onResetMode={onResetMode} />
            {/* Outside the tilt so position:fixed works and the pill never skews */}
            <Navbar />

            <TiltPresentationWrapper containerRef={scrollContainerRef}>
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
                    style={{ transform: 'translateZ(40px)' }} // Drops a deep physical shadow onto the back pane
                >
                    <main>
                        {/* Floating left-to-right drift applies to the hero only */}
                        <motion.div
                            animate={{ y: [-12, 12, -12], rotateZ: [-0.5, 0.5, -0.5] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            <Hero />
                        </motion.div>
                        <About />
                        <TickerSection />
                        <WorkGrid />
                        <Experience />
                        <Research />
                        <Process />
                    </main>
                    <Footer onResetMode={onResetMode} />
                </motion.div>
            </TiltPresentationWrapper>
        </ScrollContainerContext.Provider>
    );
};

export default FunModePage;
