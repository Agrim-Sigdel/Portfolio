import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';
import Squiggle from '../../../shared/ui/Squiggle';
import { projectsData } from '../../../entities/portfolio/model';

const WorkGrid = () => {
    return (
        <section id="work" className="container" style={{ padding: '4rem 0' }}>
            <h2 className="sr-only">Selected Work</h2>
            <div className="masonry-grid">
                {projectsData.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        style={{
                            padding: '3rem 2.5rem',
                            backgroundColor: project.color,
                            borderRadius: '8px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        whileHover={{ y: -5 }}
                    >
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">{project.category}</p>
                            <h3 className="font-serif text-3xl mb-6 leading-tight" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {project.title}
                                {project.status && (
                                    <span style={{
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: 'var(--accent, #ff4c2b)',
                                        border: '1px solid rgba(255, 76, 43, 0.4)',
                                        borderRadius: '999px',
                                        padding: '0.25rem 0.7rem',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {project.status}
                                    </span>
                                )}
                            </h3>

                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Challenge</h4>
                                <p style={{ color: 'var(--text-cream)', lineHeight: 1.6 }}>{project.pitch}</p>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Outcome</h4>
                                <p style={{ color: 'var(--text-cream)', lineHeight: 1.6 }}>{project.outcome}</p>
                            </div>

                            {project.links && project.links.length > 0 && (
                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {project.links.map((link) => (
                                        <a
                                            key={link.url}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
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
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default WorkGrid;
