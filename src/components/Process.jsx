import { motion } from 'framer-motion';

const steps = [
    {
        id: 1,
        title: 'Strategize',
        desc: 'I don’t start until I know the "Why." Every solution begins with a clear objective and a deep dive into the problem space.',
        icon: '01'
    },
    {
        id: 2,
        title: 'Execute',
        desc: 'Fast iterations and clean code/design. I focus on building robust foundations that can scale and adapt.',
        icon: '02'
    },
    {
        id: 3,
        title: 'Refine',
        desc: 'Because the first draft is just the beginning. Continuous improvement and feedback loops are core to my work.',
        icon: '03'
    },
];

const Process = () => {
    return (
        <section id="process" className="container" style={{ padding: '8rem 0', borderTop: '1px solid #222' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{ marginBottom: '5rem' }}
            >
                <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">The Method</p>
                <h2 className="font-serif text-5xl">Method to the <span style={{ fontStyle: 'italic' }}>Madness</span></h2>
            </motion.div>

            <div className="process-grid">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        style={{ position: 'relative' }}
                    >
                        <span style={{
                            fontSize: '8rem',
                            fontFamily: 'var(--font-serif)',
                            opacity: 0.05,
                            position: 'absolute',
                            top: '-3rem',
                            left: '-1rem',
                            zIndex: 0
                        }}>
                            {step.icon}
                        </span>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 className="font-serif text-3xl mb-4">{step.title}</h3>
                            <p className="text-muted leading-relaxed" style={{ fontSize: '1.1rem' }}>{step.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Process;
