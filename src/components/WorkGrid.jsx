import { motion } from 'framer-motion';

const projects = [
    {
        id: 1,
        title: 'The Big One',
        category: 'Full-Stack Platform',
        pitch: 'The project that kept me up at night.',
        outcome: 'Successful launch with 20% efficiency gain.',
        color: '#111'
    },
    {
        id: 2,
        title: 'The Problem Solver',
        category: 'Internal Automation',
        pitch: 'Someone said "this is impossible," so I did it.',
        outcome: 'Streamlined workflow saved 15+ hours/week.',
        color: '#151515'
    },
    {
        id: 3,
        title: 'The Passion Project',
        category: 'Lab Experiment',
        pitch: 'Built just to see if I could.',
        outcome: 'Exploration of reactive state management.',
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
