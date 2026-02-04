import Squiggle from './Squiggle';

const Footer = () => {
    return (
        <footer
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
                    <Squiggle
                        style={{ top: '-40px', left: '50%', transform: 'translateX(-50%)' }}
                        animateType="draw"
                        strokeColor="var(--accent-red)"
                        strokeWidth="8"
                        width="300"
                        height="80"
                        delay={0.5}
                    />
                    <h2
                        className="font-serif"
                        style={{
                            fontSize: 'clamp(3rem, 7vw, 6rem)',
                            marginBottom: '4rem',
                            lineHeight: 1.1,
                            maxWidth: '900px',
                            margin: '0 auto 4rem'
                        }}
                    >
                        Have a project in mind? <br /> <span className="text-accent" style={{ fontStyle: 'italic' }}>Let’s make it happen.</span>
                    </h2>
                </div>

                <button
                    className="bg-accent-red"
                    data-cursor="Let's Talk"
                    style={{
                        backgroundColor: 'var(--accent-red)',
                        border: '2px solid var(--accent-red)',
                        color: '#fff',
                        padding: '1.2rem 3rem',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        borderRadius: '3rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 10px 30px rgba(255, 76, 43, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 15px 40px rgba(255, 76, 43, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 10px 30px rgba(255, 76, 43, 0.3)';
                    }}
                >
                    Let's Connect
                </button>

                <div className="flex justify-between items-end mt-20 text-sm text-muted"
                    style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6rem', flexWrap: 'wrap', gap: '2rem' }}>
                    <div className="text-left">

                        <p>Kathmandu, Bagmati, Nepal</p>
                        <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>sigdelagrim35@gmail.com</p>
                    </div>
                    <div className="flex gap-4" style={{ display: 'flex', gap: '1.5rem' }}>
                        <a href="https://github.com/Agrim-Sigdel" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a>
                        <a href="https://www.linkedin.com/in/agrim-sigdel-34b532151/" className="hover:text-white">LinkedIn</a>
                        <a href="https://www.instagram.com/_agrimsigdel_/" className="hover:text-white">Instagram</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
