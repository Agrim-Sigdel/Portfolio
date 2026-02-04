import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Squiggle from '../../../shared/ui/Squiggle';
import content from '../../../data/content.json';

const About = () => {
    const { common, funMode } = content;
    const { about } = funMode;

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
                        <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">About Me</p>
                    </div>
                    <h2 className="font-serif text-5xl mb-12">The <span style={{ fontStyle: 'italic' }}>Human</span> Bit</h2>

                    <div style={{ marginBottom: '3rem' }}>
                        <h4 className="text-sm uppercase tracking-widest mb-4 opacity-50">{about.subtitle}</h4>
                        <p className="leading-relaxed text-lg" style={{ color: 'var(--text-cream)' }}>
                            {common.personal.summary}
                        </p>
                    </div>

                    <div style={{ marginBottom: '3rem' }}>
                        <h4 className="text-sm uppercase tracking-widest mb-4 opacity-50">Education & Background</h4>
                        <p className="leading-relaxed text-lg" style={{ color: 'var(--text-cream)' }}>
                            {common.education[0].degree} from {common.education[0].school}.
                            {common.education[0].year}.
                        </p>
                    </div>
                </motion.div>

                {/* Skills Side */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ textAlign: 'left' }}
                >
                    <p className="text-accent uppercase tracking-widest text-xs font-bold mb-8">{about.techStackTitle}</p>
                    <div className="flex flex-wrap gap-3">
                        {common.skills.flatList.map((skill, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                style={{
                                    display: 'inline-block',
                                    padding: '0.5rem 1.5rem',
                                    backgroundColor: 'rgba(255, 76, 43, 0.1)',
                                    border: '1px solid rgba(255, 76, 43, 0.3)',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-cream)'
                                }}
                            >
                                {skill}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
