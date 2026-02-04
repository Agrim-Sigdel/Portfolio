import { motion } from 'framer-motion';
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

const FunModePage = ({ onResetMode, onSwitchMode }) => {
    return (
        <>
            <CustomCursor />
            <SnakeBackground />
            <ThemeToggle />
            <ReturnToStartButton onResetMode={onResetMode} />
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
            >
                <Navbar />
                <Hero />
                <About />
                <TickerSection />
                <WorkGrid />
                <Process />
                <Footer onResetMode={onResetMode} />
            </motion.div>
        </>
    );
};

export default FunModePage;
