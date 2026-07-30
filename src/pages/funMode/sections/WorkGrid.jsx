import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Squiggle from '../../../shared/ui/Squiggle';
import ProjectCard from '../../../shared/ui/ProjectCard';
import { getFeaturedProjects, getProjectsData } from '../../../entities/portfolio/model';
import { useContent } from '../../../shared/lib/contentStore';

const WorkGrid = () => {
    useContent(); // re-render when content changes
    const featured = getFeaturedProjects();
    const totalCount = getProjectsData().length;
    return (
        <section id="work" className="container" style={{ padding: '4rem 0' }}>
            {/* Was an sr-only heading, so the grid arrived with no title at all.
                Now a visible section header matching About / Research / Process:
                squiggle + accent eyebrow + serif h2 with an italic accent word. */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{ marginBottom: '3.5rem' }}
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
                    <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">
                        Projects &amp; Open Source
                    </p>
                </div>
                <h2 className="font-serif text-5xl">
                    Selected <span style={{ fontStyle: 'italic' }}>works</span>.
                </h2>
            </motion.div>

            <div className="masonry-grid">
                {featured.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                ))}
            </div>

            {/* The grid shows only the featured picks; the rest live at /work. */}
            {totalCount > featured.length && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{ display: 'flex', justifyContent: 'center' }}
                >
                    <Link
                        to="/work"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.9rem 1.8rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: 'var(--accent, #ff4c2b)',
                            border: '1px solid rgba(255, 76, 43, 0.4)',
                            textDecoration: 'none'
                        }}
                    >
                        View all <FiArrowRight aria-hidden="true" />
                    </Link>
                </motion.div>
            )}
        </section>
    );
};

export default WorkGrid;
