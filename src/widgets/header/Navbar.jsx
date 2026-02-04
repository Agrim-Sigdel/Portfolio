import { motion } from 'framer-motion';
import ThemeToggle from '../../shared/ui/ThemeToggle';

const Navbar = () => {
    return (
        <div className="Navbar-wrapper" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000, boxSizing: 'border-box' }}>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
                style={{
                    width: '100%',
                    padding: '1.5rem 4vw',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxSizing: 'border-box'
                }}
            >
                <div className="left flex gap-6 text-sm uppercase tracking-widest" style={{ display: 'flex', gap: '2rem', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', minWidth: '150px' }}>
                    <a href="#work" className="hover:text-accent transition-colors navbar-link" data-cursor="Projects">Work</a>
                    <a href="#about" className="hover:text-accent transition-colors navbar-link" data-cursor="About">About</a>
                </div>

                <div className="logo font-serif text-2xl font-bold italic" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center', color: 'white' }} data-cursor="Home">
                    Portfolio
                </div>

                <div className="right" style={{ minWidth: '150px', textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <ThemeToggle />
                    <button
                        className="bg-accent-red px-6 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
                        data-cursor="Talk"
                        style={{
                            backgroundColor: 'var(--accent-red)',
                            padding: '0.7rem 1.2rem',
                            borderRadius: '2rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Let's Connect
                    </button>
                </div>
            </motion.nav>
        </div>
    );
};

export default Navbar;
