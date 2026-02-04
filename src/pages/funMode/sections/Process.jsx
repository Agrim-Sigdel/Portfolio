import { motion } from 'framer-motion';
import { processSteps } from '../../../entities/portfolio/model';

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
                {processSteps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ y: 40, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        style={{
                            padding: '3rem 0',
                            borderTop: '1px solid #222'
                        }}
                    >
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 className="font-serif text-3xl" style={{ marginBottom: '1rem' }}>
                                {step.title}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                {step.desc}
                            </p>
                        </div>
                        <p style={{ fontSize: '2rem', opacity: 0.3, fontWeight: 'bold' }}>
                            {step.icon}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Process;
