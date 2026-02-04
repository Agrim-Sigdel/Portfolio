import { motion } from 'framer-motion';
import Squiggle from '../../../shared/ui/Squiggle';
import { projectsData } from '../../../entities/portfolio/model';

const WorkGrid = () => {
    return (
        <section id="work" className="container" style={{ padding: '4rem 0' }}>
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
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        whileHover={{ y: -5 }}
                    >
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">{project.category}</p>
                            <h3 className="font-serif text-3xl mb-6 leading-tight">{project.title}</h3>

                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Challenge</h4>
                                <p style={{ color: 'var(--text-cream)', lineHeight: 1.6 }}>{project.pitch}</p>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Outcome</h4>
                                <p style={{ color: 'var(--text-cream)', lineHeight: 1.6 }}>{project.outcome}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default WorkGrid;
