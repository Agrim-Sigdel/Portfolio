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
            setIsMobileMenuOpen(false);
        }
    };

    const contactLine = [];
    if (common.contact?.location) contactLine.push(common.contact.location);
    if (common.contact?.email) contactLine.push(common.contact.email);
    if (common.contact?.phone) contactLine.push(common.contact.phone);
    if (common.contact?.github) contactLine.push(common.contact.github);

    return (
        <div className="normal-mode">
            <div className="normal-mode-decoration" aria-hidden="true">
                <div className="normal-mode-reel normal-mode-reel-left"></div>
                <div className="normal-mode-reel normal-mode-reel-right"></div>
            </div>

            <div className="normal-mobile-header">
                <div className="normal-mobile-brand">
                    <img src="/favicon_io-2/apple-touch-icon.png" alt="Logo" />
                </div>
                <button
                    className="normal-mobile-menu-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            <nav className={`normal-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="normal-nav-logo">
                    <img src="/favicon_io-2/apple-touch-icon.png" alt="Logo" />
                </div>
                <div className="normal-nav-links">
                    <button onClick={() => scrollToSection('about')} className="normal-nav-link">About</button>
                    <button onClick={() => scrollToSection('education')} className="normal-nav-link">Education</button>
                    <button onClick={() => scrollToSection('experience')} className="normal-nav-link">Experience</button>
                    <button onClick={() => scrollToSection('projects')} className="normal-nav-link">Projects</button>
                    <button onClick={() => scrollToSection('skills')} className="normal-nav-link">Skills</button>
                    <button onClick={() => scrollToSection('contact')} className="normal-nav-link">Contact</button>
                </div>
                <div className="normal-nav-divider"></div>
                <button onClick={onResetMode} className="normal-nav-link normal-nav-return">↩ Return to Start</button>
            </nav>

            <div className="normal-container">
                <header className="normal-header cv-header">
                    <h1 className="cv-name">{common.personal.name}</h1>
                    <p className="cv-role">{common.personal.tagline}</p>
                    <p className="cv-contact">{contactLine.join(' • ')}</p>
                    <p>
                        <a className="cv-download" href="/Agrim%20Sigdel%20CV.pdf" download>
                            Download CV
                        </a>
                    </p>
                </header>

                <section id="about" className="normal-section cv-summary">
                    <h2>Profile</h2>
                    <p className="normal-lead">{common.personal.summary}</p>
                </section>

                {common.personal?.areasOfExpertise && (
                    <section id="expertise" className="normal-section">
                        <h2>Areas of Expertise</h2>
                        <p className="normal-meta">
                            {common.personal.areasOfExpertise.join(' • ')}
                        </p>
                    </section>
                )}

                <section id="experience" className="normal-section">
                    <h2>Work Experience</h2>
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

                <section id="education" className="normal-section">
                    <h2>Education</h2>
                    {common.education.map((edu, index) => (
                        <div key={index} className="normal-item">
                            <h3>{edu.degree}</h3>
                            <p className="normal-meta">{edu.school} • {edu.year}</p>
                        </div>
                    ))}
                </section>

                <section id="skills" className="normal-section">
                    <h2>Skills</h2>
                    {common.skills?.categories?.map((cat, i) => (
                        <div key={i} className="normal-skills-category">
                            <h3>{cat.name}</h3>
                            <p>{cat.items.join(', ')}</p>
                        </div>
                    ))}
                </section>

                <section id="contact" className="normal-section">
                    <h2>Contact</h2>
                    <ul className="normal-contact-list">
                        {common.contact && (
                            <li>
                                <strong>Contact</strong>
                                <div>{common.contact.email}</div>
                                {common.contact.phone && <div>{common.contact.phone}</div>}
                                {common.contact.github && <div>{common.contact.github}</div>}
                            </li>
                        )}
                    </ul>
                </section>

                <footer className="normal-footer">{common.personal.shortSummary}</footer>
            </div>
        </div>
    );
};

export default NormalModeLayout;
