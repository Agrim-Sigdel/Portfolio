import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MdDarkMode, MdLightMode, MdMenu, MdClose } from 'react-icons/md';
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
    { id: 'about', label: 'About' },
    { id: 'work', label: 'Work' },
    { id: 'experience', label: 'Experience' },
    { id: 'research', label: 'Research' },
];

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const scrollContainerRef = useScrollContainerRef();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    const scrollToSection = (id) => {
        setMenuOpen(false);
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
        setMenuOpen(false);
        const container = scrollContainerRef?.current;
        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderLinks = (className) =>
        LINKS.map((link) => (
            <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.id);
                }}
                className={className}
            >
                {link.label}
            </a>
        ));

    return (
        <div className="navbar-wrap">
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
                className="navbar-pill"
            >
                <button type="button" className="navbar-logo" onClick={scrollToTop}>
                    AGRIM.
                </button>

                <div className="navbar-links">{renderLinks('navbar-link')}</div>

                <button
                    type="button"
                    onClick={toggleTheme}
                    className="navbar-theme-toggle"
                    aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                    {isDark ? <MdLightMode aria-hidden="true" /> : <MdDarkMode aria-hidden="true" />}
                </button>

                <button
                    type="button"
                    className="navbar-menu-btn"
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    aria-controls="navbar-sheet"
                    onClick={() => setMenuOpen((v) => !v)}
                >
                    {menuOpen ? <MdClose aria-hidden="true" /> : <MdMenu aria-hidden="true" />}
                </button>
            </motion.nav>

            {menuOpen && (
                <div id="navbar-sheet" className="navbar-sheet">
                    {renderLinks('navbar-sheet-link')}
                </div>
            )}
        </div>
    );
};

export default Navbar;
