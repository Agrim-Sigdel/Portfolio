import React from 'react';
import '../styles/normal-mode.css';

const NormalMode = ({ onResetMode }) => {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="normal-mode">
            {/* Navigation Sidebar */}
            <nav className="normal-nav">
                <button onClick={() => scrollToSection('about')} className="normal-nav-link">About</button>
                <button onClick={() => scrollToSection('education')} className="normal-nav-link">Education</button>
                <button onClick={() => scrollToSection('experience')} className="normal-nav-link">Experience</button>
                <button onClick={() => scrollToSection('projects')} className="normal-nav-link">Projects</button>
                <button onClick={() => scrollToSection('skills')} className="normal-nav-link">Skills</button>
                <button onClick={() => scrollToSection('contact')} className="normal-nav-link">Contact</button>
                <div className="normal-nav-divider"></div>
                <button onClick={onResetMode} className="normal-nav-link normal-nav-return">↩ Return to Start</button>
            </nav>

            <div className="normal-container">
                {/* Header */}
                <header className="normal-header">
                    <h1>Agrim Sigdel</h1>
                    <p className="normal-subtitle">Full-Stack Developer | AI Enthusiast | Creative Problem Solver</p>
                </header>

                {/* About Section */}
                <section id="about" className="normal-section">
                    <h2>About Me</h2>
                    <p className="normal-lead">
                        Versatile Full-Stack Developer with a strong foundation in modern AI, specializing in React/TypeScript and Python.
                        I bridge the gap between complex AI models and user-centric applications, delivering production-ready code for
                        Computer Vision and NLP domains.
                    </p>
                </section>

                {/* Education */}
                <section id="education" className="normal-section">
                    <h2>Education</h2>
                    <div className="normal-item">
                        <h3>BSc. Computer Science and Information Technology (CSIT)</h3>
                        <p className="normal-meta">Prime College, Kathmandu • Expected Graduation: April 2026</p>
                    </div>
                </section>

                {/* Experience */}
                <section id="experience" className="normal-section">
                    <h2>Experience</h2>
                    <div className="normal-item">
                        <h3>Creative Lead</h3>
                        <p className="normal-meta">Prime College Graduation Committee • 2024 - 2026</p>
                        <ul className="normal-list">
                            <li>Led creative direction and brand guidelines for 625+ attendees</li>
                            <li>Managed cross-functional teams for visual and marketing materials</li>
                            <li>Coordinated event planning and execution</li>
                            <li>Developed comprehensive branding strategy</li>
                        </ul>
                    </div>
                    <div className="normal-item">
                        <h3>Full-Stack Developer & AI Engineer</h3>
                        <p className="normal-meta">Freelance / Personal Projects • 2022 - Present</p>
                        <ul className="normal-list">
                            <li>Developed production-ready AI applications</li>
                            <li>Built modern web applications with React/TypeScript</li>
                            <li>Implemented Computer Vision and NLP solutions</li>
                            <li>Delivered scalable backend systems</li>
                        </ul>
                    </div>
                </section>

                {/* Projects */}
                <section id="projects" className="normal-section">
                    <h2>Projects</h2>

                    <div className="normal-item">
                        <h3>ANPR System</h3>
                        <p className="normal-meta">AI & Full-Stack</p>
                        <p>Highly optimized YOLOv8 backend with a modern React/TypeScript frontend for Nepali plate recognition.</p>
                        <p className="normal-outcome"><strong>Outcome:</strong> 30 FPS live processing with custom Devanagari recognition logic.</p>
                    </div>

                    <div className="normal-item">
                        <h3>Parking Management System</h3>
                        <p className="normal-meta">Automation & Backend</p>
                        <p>End-to-end automatic parking system utilizing custom ANPR for real-time verification and access control.</p>
                        <p className="normal-outcome"><strong>Outcome:</strong> Automated gate entry/exit reducing manual verification significantly.</p>
                    </div>

                    <div className="normal-item">
                        <h3>Reddit Sentiment Analysis</h3>
                        <p className="normal-meta">NLP / Deep Learning</p>
                        <p>Deep NLP pipeline using fine-tuned BERT for nuanced emotion classification on large-scale Reddit data.</p>
                        <p className="normal-outcome"><strong>Outcome:</strong> Practiced advanced prompt engineering and LLM-based interfaces.</p>
                    </div>
                </section>

                {/* Skills */}
                <section id="skills" className="normal-section">
                    <h2>Technical Skills</h2>

                    <div className="normal-skills-category">
                        <h3>Frontend Development</h3>
                        <p>TypeScript, React, Next.js, TailwindCSS, Framer Motion, Vite</p>
                    </div>

                    <div className="normal-skills-category">
                        <h3>Backend Development</h3>
                        <p>Python, Django, Flask, REST APIs, MySQL, PostgreSQL</p>
                    </div>

                    <div className="normal-skills-category">
                        <h3>AI & Machine Learning</h3>
                        <p>PyTorch, YOLOv8, RT-DETR, BERT, TensorFlow, OpenCV</p>
                    </div>

                    <div className="normal-skills-category">
                        <h3>Tools & Technologies</h3>
                        <p>Git/GitHub, Figma, Docker, VS Code, Postman, Linux</p>
                    </div>
                </section>

                {/* Contact */}
                <section id="contact" className="normal-section">
                    <h2>Contact</h2>
                    <p>Let's connect! I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.</p>
                    <ul className="normal-contact-list">
                        <li><strong>Email:</strong> agrim.sigdel@example.com</li>
                        <li><strong>LinkedIn:</strong> linkedin.com/in/agrimsigdel</li>
                        <li><strong>GitHub:</strong> github.com/agrimsigdel</li>
                        <li><strong>Portfolio:</strong> agrimsigdel.com</li>
                    </ul>
                </section>

                {/* Footer */}
                <footer className="normal-footer">
                    <p>© 2026 Agrim Sigdel. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default NormalMode;
