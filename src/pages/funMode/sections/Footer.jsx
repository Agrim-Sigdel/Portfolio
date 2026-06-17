import Squiggle from '../../../shared/ui/Squiggle';
import ContactForm from '../../../shared/ui/ContactForm';
import './ContactForm.css';

const Footer = ({ onResetMode }) => {
    return (
        <footer
            id="contact"
            style={{
                marginTop: '8rem',
                padding: '6rem 5vw',
                backgroundColor: '#111',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* 3D Grid Background Effect */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)',
                    transformOrigin: 'top center',
                    pointerEvents: 'none'
                }}
            />

            <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <h2
                        className="font-serif"
                        style={{
                            fontSize: 'clamp(3rem, 7vw, 6rem)',
                            marginBottom: '4rem',
                            lineHeight: 1.1,
                            maxWidth: '900px',
                            margin: '0 auto 4rem',
                            color: '#f5f0e8'
                        }}
                    >
                        Have a project in mind? <br /> <span className="text-accent" style={{ fontStyle: 'italic' }}>Let's make it happen.</span>
                    </h2>
                </div>

                <ContactForm variant="fun" />

                <div style={{ marginTop: '4rem', paddingTop: '4rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ opacity: 0.5, fontSize: '0.9rem', color: '#f5f0e8' }}>
                        © 2026 Agrim Sigdel. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
