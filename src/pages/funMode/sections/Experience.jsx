import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';
import Squiggle from '../../../shared/ui/Squiggle';
import content from '../../../data/content.json';

const Experience = () => {
    const { experience } = content.common;
    if (!experience || !experience.length) return null;

    return (
        <section id="experience" className="container" style={{ padding: '8rem 0', borderTop: '1px solid #222' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{ marginBottom: '4rem', position: 'relative' }}
            >
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Squiggle
                        style={{ top: '-10px', left: '-20px' }}
                        animateType="float"
                        strokeColor="var(--text-muted)"
                        strokeWidth="5"
                        width="150"
                        height="50"
                        viewBox="0 0 400 100"
                    />
                    <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">Experience</p>
                </div>
                <h2 className="font-serif text-5xl">
                    Where I've <span style={{ fontStyle: 'italic' }}>built</span>.
                </h2>
            </motion.div>

            <div style={{ position: 'relative' }}>
                {experience.map((exp, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.7, delay: index * 0.1 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr)',
                            gap: '1rem',
                            padding: '2.5rem 0',
                            borderTop: '1px solid #222'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 className="font-serif text-3xl" style={{ lineHeight: 1.1 }}>{exp.role}</h3>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', alignSelf: 'center' }}>
                                {exp.period}
                            </span>
                        </div>

                        <p className="text-accent" style={{ fontSize: '1rem', fontWeight: 600, marginTop: '-0.25rem' }}>
                            {exp.company}
                        </p>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', display: 'grid', gap: '0.75rem' }}>
                            {exp.description.map((d, di) => (
                                <li key={di} style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-cream)', lineHeight: 1.6 }}>
                                    <span className="text-accent" style={{ flexShrink: 0 }}> - </span>
                                    <span>{d}</span>
                                </li>
                            ))}
                        </ul>

                        {exp.links && exp.links.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {exp.links.map((link) => (
                                    <a
                                        key={link.url}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 1.1rem',
                                            border: '1px solid rgba(255, 76, 43, 0.4)',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            color: 'var(--accent, #ff4c2b)',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        {link.label} <FiExternalLink aria-hidden="true" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Experience;
