import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
    return (
        <div style={{ position: 'fixed', top: '30px', left: 0, width: '100%', zIndex: 1000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
                className="navbar-pill"
                style={{ pointerEvents: 'auto' }}
            >
                <div className="navbar-logo" data-cursor="Home" onClick={() => document.querySelector('#root')?.scrollIntoView({ behavior: 'smooth' })}>
                    AGRIM.
                </div>

                <div className="navbar-links">
                    <a href="#work" onClick={(e) => {
                        e.preventDefault();
                        document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
                    }} className="navbar-link" data-cursor="Projects">Work</a>
                    
                    <a href="#about" onClick={(e) => {
                        e.preventDefault();
                        document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
                    }} className="navbar-link" data-cursor="About">About</a>
                </div>
            </motion.nav>
        </div>
    );
};

export default Navbar;
