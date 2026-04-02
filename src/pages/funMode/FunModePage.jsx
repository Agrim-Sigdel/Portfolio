import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import Navbar from '../../widgets/header/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import WorkGrid from './sections/WorkGrid';
import Process from './sections/Process';
import Footer from './sections/Footer';
import TickerSection from './sections/TickerSection';
import CustomCursor from '../../shared/ui/CustomCursor';
import SnakeBackground from '../../shared/ui/SnakeBackground';
import ReturnToStartButton from '../../shared/ui/ReturnToStartButton';
import ThemeToggle from '../../shared/ui/ThemeToggle';
import './funMode.css'; // Add a CSS file reference if needed, assuming it's loaded globally usually

// A component that wraps its children in a mouse-responsive 3D tilt
const TiltPresentationWrapper = ({ children }) => {
    const containerRef = React.useRef(null);
    const { scrollY } = useScroll({ container: containerRef });

    // Track mouse to generate base tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { damping: 30, stiffness: 100 });
    const smoothY = useSpring(mouseY, { damping: 30, stiffness: 100 });

    const handleMouseMove = (e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    // calculate final rotations matching mouse position, but fading out as we scroll down
    const rotateX = useTransform([smoothY, scrollY], ([y, scroll]) => {
        const baseTilt = 12 - (y / 800) * 8; // approx 12 to 4 degrees
        const fade = Math.max(0, 1 - (scroll / 400)); // fades to 0 linearly by 400px scroll
        return baseTilt * fade;
    });

    const rotateY = useTransform([smoothX, scrollY], ([x, scroll]) => {
        const baseTilt = -20 - (x / 1400) * -10; // approx -20 to -10 degrees
        const fade = Math.max(0, 1 - (scroll / 400));
        return baseTilt * fade;
    });

    return (
        <div 
            style={{ 
                width: '100vw', 
                height: '100vh', 
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
                    height: '100vh',
                    rotateX,
                    rotateY,
                    rotateZ: 0,
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center center',
                    boxShadow: '-40px 40px 100px rgba(0,0,0,0.8)', 
                    borderRadius: '20px',
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

const FunModePage = ({ onResetMode, onSwitchMode }) => {
    return (
        <>
            <CustomCursor />
            <ReturnToStartButton onResetMode={onResetMode} />
            
            <TiltPresentationWrapper>
                {/* <SnakeBackground /> // Optional: might lag in 3D transform, disabled for cleaner 3D */}
                
                <motion.div
                    animate={{ y: [-12, 12, -12], rotateZ: [-0.5, 0.5, -0.5] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
                        style={{ transform: 'translateZ(40px)' }} // Drops a deep physical shadow onto the back pane
                    >
                        <Navbar />
                        <Hero />
                        <About />
                        <TickerSection />
                        <WorkGrid />
                        <Process />
                        <Footer onResetMode={onResetMode} />
                    </motion.div>
                </motion.div>
            </TiltPresentationWrapper>
        </>
    );
};

export default FunModePage;
