import { motion } from 'framer-motion';

const About = () => {
    const tools = ['Python', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'Django', 'Framer Motion'];

    return (
        <section id="about" className="container" style={{ padding: '8rem 0', borderTop: '1px solid #222' }}>
            <div className="about-grid">
                {/* Professional Side */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ textAlign: 'left' }}
                >
                    <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">About Me</p>
                    <h2 className="font-serif text-5xl mb-12">The <span style={{ fontStyle: 'italic' }}>Human</span> Bit</h2>

                    <div style={{ marginBottom: '3rem' }}>
                        <h4 className="text-sm uppercase tracking-widest mb-4 opacity-50">Professional Side</h4>
                        <p className="leading-relaxed text-lg" style={{ color: 'var(--text-cream)' }}>
                            I’m an authentic, adaptive collaborator who prefers candor over fluff.
                            I value clarity and insight, focusing on building sustainable systems that solve real problems.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm uppercase tracking-widest mb-4 opacity-50">Personal Side</h4>
                        <p className="leading-relaxed text-lg">
                            When I’m not at my desk, you can find me exploring new technologies or figuring out how to automate my life.
                            I believe in lifelong learning and the power of simple, effective design.
                        </p>
                    </div>
                </motion.div>

                {/* Toolkit */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ backgroundColor: 'var(--bg-panel)', padding: '4rem', borderRadius: '8px' }}
                >
                    <h3 className="font-serif text-3xl mb-8">The Toolkit</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {tools.map((tool) => (
                            <span
                                key={tool}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: 'var(--text-muted)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.borderColor = 'var(--accent-red)';
                                    e.target.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor = '#333';
                                    e.target.style.color = 'var(--text-muted)';
                                }}
                            >
                                {tool}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
