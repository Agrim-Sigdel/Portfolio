import React, { useState } from 'react';
import '../styles/normal-mode.css';
import content from '../data/content.json';

const NormalModeLayout = ({ onResetMode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { common } = content;

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false); // Close menu on selection
        }
    };

    return (
        <div className="normal-mode">
            {/* Mobile Header */}
            <div className="normal-mobile-header">
                <div className="normal-mobile-brand">AS</div>
                <button 
                    className="normal-mobile-menu-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Navigation Sidebar */}
            <nav className={`normal-nav ${isMobileMenuOpen ? 'open' : ''}`}>
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
                    <h1>{common.personal.name}</h1>
                    <p className="normal-subtitle">{common.personal.tagline}</p>
                </header>

                {/* About Section */}
                <section id="about" className="normal-section">
                    <h2>About Me</h2>
                    <p className="normal-lead">
                        {common.personal.summary}
                    </p>
                </section>

                {/* Education */}
                <section id="education" className="normal-section">
                    <h2>Education</h2>
                    {common.education.map((edu, index) => (
                        <div key={index} className="normal-item">
                            <h3>{edu.degree}</h3>
                            <p className="normal-meta">{edu.school} • {edu.year}</p>
                        </div>
                    ))}
                </section>

                {/* Experience */}
                <section id="experience" className="normal-section">
                    <h2>Experience</h2>
                    {common.experience.map((exp, index) => (
                        <div key={index} className="normal-item">
                            <h3>{exp.role}</h3>
                            <p className="normal-meta">{exp.company} • {exp.period}</p>
                            <ul className="normal-list">
                                {exp.description.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>

                {/* Projects */}
                <section id="projects" className="normal-section">
                    <h2>Projects</h2>
                    {common.projects.map((project) => (
                        <div key={project.id} className="normal-item">
                            <h3>{project.title}</h3>
                            <p className="normal-meta">{project.category}</p>
                            <p>{project.description}</p>
                            <p className="normal-outcome"><strong>Outcome:</strong> {project.outcome}</p>
                        </div>
                    ))}
                </section>

                {/* Skills */}
                <section id="skills" className="normal-section">
                    <h2>Technical Skills</h2>
                    {common.skills.categories.map((category, index) => (
                        <div key={index} className="normal-skills-category">
                            <h3>{category.name}</h3>
                            <p>{category.items.join(', ')}</p>
                        </div>
                    ))}
                </section>

                {/* Contact */}
                <section id="contact" className="normal-section">
                    <h2>Contact</h2>
                    <p>Let's connect! I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.</p>
                    <ul className="normal-contact-list">
                        <li><strong>Email:</strong> {common.contact.email}</li>
                        <li><strong>LinkedIn:</strong> {common.contact.linkedin}</li>
                        <li><strong>GitHub:</strong> {common.contact.github}</li>
                        <li><strong>Portfolio:</strong> {common.contact.portfolio}</li>
                    </ul>
                </section>

                {/* Footer */}
                <footer className="normal-footer">
                    <p>© {new Date().getFullYear()} {common.personal.name}. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default NormalModeLayout;
