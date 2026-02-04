import { motion } from 'framer-motion';
import ThemeToggle from '../../shared/ui/ThemeToggle';
import './Navbar.css';

const Navbar = () => {
    return (
        <div className="Navbar-wrapper" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000, boxSizing: 'border-box' }}>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
                className="navbar-nav"
            >
                <div className="navbar-left">
                    <a href="#work" className="hover:text-accent transition-colors navbar-link" data-cursor="Projects">Work</a>
                    <a href="#about" className="hover:text-accent transition-colors navbar-link" data-cursor="About">About</a>
                </div>

                <div className="navbar-logo" data-cursor="Home">
                    Portfolio
                </div>

                <div className="navbar-right">
                    <ThemeToggle />
                    {/* <button
                        className="navbar-cta"
                        data-cursor="Talk"
                    >
                        Let's Connect
                    </button> */}
                </div>
            </motion.nav>
        </div>
    );
};

export default Navbar;
