import { motion } from 'framer-motion';

const projects = [
    {
        id: 1,
        title: 'ANPR System',
        category: 'AI & Full-Stack',
        pitch: 'Highly optimized YOLOv8 backend with a modern React/TypeScript frontend for Nepali plate recognition.',
        outcome: '30 FPS live processing with custom Devanagari recognition logic.',
        color: '#111'
    },
    {
        id: 2,
        title: 'Parking Management',
        category: 'Automation & Backend',
        pitch: 'End-to-end automatic parking system utilizing custom ANPR for real-time verification and access control.',
        outcome: 'Automated gate entry/exit reducing manual verification significantly.',
        color: '#151515'
    },
    {
        id: 3,
        title: 'Reddit Sentiment Analysis',
        category: 'NLP / Deep Learning',
        pitch: 'Deep NLP pipeline using fine-tuned BERT for nuanced emotion classification on large-scale Reddit data.',
        outcome: 'Practiced advanced prompt engineering and LLM-based interfaces.',
        color: '#0d0d0d'
    },
];

const WorkGrid = () => {
    return (
        <section id="work" className="container" style={{ padding: '4rem 0' }}>
            <div className="masonry-grid">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="project-card"
                        data-cursor="View"
                        style={{
                            minHeight: '450px',
                            backgroundColor: project.color,
                            marginBottom: '2rem',
                            borderRadius: '4px',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '2rem',
                            cursor: 'pointer'
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                opacity: 0.6
                            }}
                        />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <p className="text-sm text-muted uppercase tracking-wider mb-2">{project.category}</p>
                            <h3 className="font-serif text-3xl mb-4">{project.title}</h3>
                            <p className="text-sm italic opacity-80 mb-2">{project.pitch}</p>
                            <p className="text-xs font-bold text-accent uppercase tracking-widest">{project.outcome}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default WorkGrid;
