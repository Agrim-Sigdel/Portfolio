import { motion } from 'framer-motion';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { useTheme } from '../../shared/lib/ThemeContext';
import { useScrollContainerRef } from '../../pages/funMode/ScrollContainerContext';
import './Navbar.css';

// The fun-mode content scrolls inside a 3D-tilted, animated (rotateZ) container.
// getBoundingClientRect() returns transform-distorted coordinates here, so we use
// offsetTop - a layout value that ignores CSS transforms - to compute the target.
const NAV_OFFSET = 90; // keep section clear of the floating nav pill

const offsetTopWithin = (el, container) => {
    let top = 0;
    let node = el;
    while (node && node !== container) {
        top += node.offsetTop;
        node = node.offsetParent;
    }
    return top;
};

const LINKS = [
     { id: 'about', label: 'About', cursor: 'Me' },
    { id: 'work', label: 'Work', cursor: 'I do ' },
    { id: 'experience', label: 'Experience', cursor: 'Accumulated' },
    { id: 'research', label: 'Research', cursor: 'Paper' },
];

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const scrollContainerRef = useScrollContainerRef();

    const scrollToSection = (id) => {
        const container = scrollContainerRef?.current;
        const target = document.getElementById(id);
        if (container && target) {
            const top = Math.max(0, offsetTopWithin(target, container) - NAV_OFFSET);
            container.scrollTo({ top, behavior: 'smooth' });
        } else if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scrollToTop = () => {
        const container = scrollContainerRef?.current;
        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={{ position: 'fixed', top: '30px', left: 0, width: '100%', zIndex: 1000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
                className="navbar-pill"
                style={{ pointerEvents: 'auto' }}
            >
                <div className="navbar-logo" data-cursor="Home" onClick={scrollToTop}>
                    AGRIM.
                </div>

                <div className="navbar-links">
                    {LINKS.map((link) => (
                        <a
                            key={link.id}
                            href={`#${link.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection(link.id);
                            }}
                            className="navbar-link"
                            data-cursor={link.cursor}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={toggleTheme}
                    className="navbar-theme-toggle"
                    data-cursor={isDark ? 'Light Mode' : 'Dark Mode'}
                    aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                    {isDark ? <MdLightMode /> : <MdDarkMode />}
                </button>
            </motion.nav>
        </div>
    );
};

export default Navbar;
