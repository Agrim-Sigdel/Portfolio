import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiExternalLink, FiArrowRight } from 'react-icons/fi';
import { useTheme } from '../lib/ThemeContext';

/*
 * ProjectCard — one project tile, shared by the fun-mode WorkGrid (featured
 * four) and the /work all-projects page so the two always render identically.
 * Presentation only; expects the shape produced by getProjectsData().
 */
const ProjectCard = ({ project, index = 0 }) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const MotionDiv = motion.div;

    return (
        <MotionDiv
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        style={{
            padding: '3rem 2.5rem',
            backgroundColor: 'var(--bg-panel)',
            border: isLight ? '1px solid var(--border-color, #e5e5e5)' : '1px solid transparent',
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
                        color: 'var(--accent, #a16161)',
                        border: '1px solid rgba(161, 97, 97, 0.4)',
                        borderRadius: '999px',
                        padding: '0.25rem 0.7rem',
                        whiteSpace: 'nowrap'
                    }}>
                        {project.status}
                    </span>
                )}
            </h3>

            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Overview</h4>
                <p style={{ color: 'var(--text-cream)', lineHeight: 1.6 }}>{project.pitch}</p>
            </div>

            <div>
                <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Outcome</h4>
                <p style={{ color: 'var(--text-cream)', lineHeight: 1.6 }}>{project.outcome}</p>
            </div>

            {project.slug && project.caseStudy && (
                <div style={{ marginTop: '2rem' }}>
                    <Link
                        to={`/work/${project.slug}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.3rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#fff',
                            backgroundColor: 'var(--accent, #a16161)',
                            textDecoration: 'none'
                        }}
                    >
                        Read case study <FiArrowRight aria-hidden="true" />
                    </Link>
                </div>
            )}

            {project.links && project.links.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
                                border: '1px solid rgba(161, 97, 97, 0.4)',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: 'var(--accent, #a16161)',
                                textDecoration: 'none'
                            }}
                        >
                            {link.label} <FiExternalLink aria-hidden="true" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    </MotionDiv>
    );
};

export default ProjectCard;
