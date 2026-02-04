import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Squiggle from '../../../shared/ui/Squiggle';
import { skillsData } from '../../../entities/portfolio/model';

const About = () => {
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
                        <h4 className="text-sm uppercase tracking-widest mb-4 opacity-50">Professional Summary</h4>
                        <p className="leading-relaxed text-lg" style={{ color: 'var(--text-cream)' }}>
                            Versatile Full-Stack Developer with a strong foundation in modern AI, specializing in React/TypeScript and Python.
                            I bridge the gap between complex AI models and user-centric applications, delivering production-ready code for Computer Vision and NLP domains.
                        </p>
                    </div>

                    <div style={{ marginBottom: '3rem' }}>
                        <h4 className="text-sm uppercase tracking-widest mb-4 opacity-50">Education & Background</h4>
                        <p className="leading-relaxed text-lg" style={{ color: 'var(--text-cream)' }}>
                            BSc. Computer Science and Information Technology (CSIT) from Prime College, Kathmandu.
                            Expected Graduation: April 2026.
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
                    <p className="text-accent uppercase tracking-widest text-xs font-bold mb-8">Tech Stack</p>
                    <div className="flex flex-wrap gap-3">
                        {skillsData.map((skill, index) => (
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
