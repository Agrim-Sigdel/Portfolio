import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiArrowRight } from 'react-icons/fi';
import content from '../data/content.json';
import DownloadButton from '../shared/ui/DownloadButton';
import { generateResumePdf } from '../shared/lib/generateResumePdf';
import ContactModal from '../shared/ui/ContactModal';
import '../styles/normal-mode.css';

const NormalModeLayout = ({ onResetMode }) => {
  const { common } = content;
  const { personal, contact, education, experience, research, projects, skills } = common;
  const [mounted, setMounted] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`cv-mode ${mounted ? 'visible' : ''}`}>
      <button className="cv-return-button" onClick={onResetMode}>
        <FiArrowLeft aria-hidden="true" /> Back to Start
      </button>
      <div className="cv-download-group">
        <DownloadButton
          className="cv-download-button"
          href="/AgrimSigdel-Resume.pdf"
          filename="Agrim Sigdel Resume.pdf"
          idleLabel="Download cv (static)"
          loadingLabel="Downloading…"
          doneLabel="Downloaded"
        />
        <DownloadButton
          className="cv-download-button cv-download-button--generated"
          getFile={generateResumePdf}
          idleLabel="Export resume (generated)"
          loadingLabel="Building…"
          doneLabel="Exported"
        />
      </div>

      <main className="cv-paper">
        {/* ---------- Header ---------- */}
        <header className="cv-header">
          <h1 className="cv-name">{personal.name}</h1>
          <p className="cv-title">{personal.tagline}</p>
          <div className="cv-contact">
            <span>{contact.location}</span>
            <span className="sep">·</span>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <span className="sep">·</span>
            <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer">{contact.website}</a>
            <span className="sep">·</span>
            <a href={contact.githubUrl} target="_blank" rel="noopener noreferrer">{contact.github}</a>
          </div>
        </header>

        {/* ---------- Summary ---------- */}
        <section className="cv-section">
          <h2 className="cv-section-title">Professional Summary</h2>
          <p className="cv-summary">{personal.summary}</p>
        </section>

        {/* ---------- Technical Skills ---------- */}
        <section className="cv-section">
          <h2 className="cv-section-title">Technical Skills</h2>
          <div className="cv-skills-grid">
            {skills.categories.map((cat) => (
              <div key={cat.name} className="cv-skill-row">
                <span className="cv-skill-cat">{cat.name}: </span>
                <span className="cv-skill-items">{cat.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Experience ---------- */}
        <section className="cv-section">
          <h2 className="cv-section-title">Work Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} className="cv-entry">
              <div className="cv-entry-head">
                <h3 className="cv-entry-role">{exp.role}</h3>
                <span className="cv-entry-period">{exp.period}</span>
              </div>
              <p className="cv-entry-company">{exp.company}</p>
              <ul className="cv-bullets">
                {exp.description.map((d, di) => (
                  <li key={di}>{d}</li>
                ))}
              </ul>
              {exp.links && exp.links.length > 0 && (
                <div className="cv-entry-links">
                  {exp.links.map((link, li) => (
                    <a key={li} href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.label} <FiExternalLink aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ---------- Research & Publications ---------- */}
        {research && research.length > 0 && (
          <section className="cv-section">
            <h2 className="cv-section-title">Research &amp; Publications</h2>
            {research.map((r, i) => (
              <div key={i} className="cv-entry">
                <div className="cv-entry-head">
                  <h3 className="cv-entry-role">{r.title}</h3>
                  <span className="cv-pill">{r.status}</span>
                </div>
                <p className="cv-entry-company">{r.role} · {r.period}</p>
                <p className="cv-citation">{r.citation}</p>
                <ul className="cv-bullets">
                  {r.highlights.map((h, hi) => (
                    <li key={hi}>{h}</li>
                  ))}
                </ul>
                {r.links && r.links.length > 0 && (
                  <div className="cv-entry-links">
                    {r.links.map((link, li) =>
                      link.download ? (
                        <DownloadButton
                          key={li}
                          href={link.url}
                          filename={link.url.split('/').pop()}
                          idleLabel={link.label}
                          loadingLabel="Downloading…"
                          doneLabel="Downloaded"
                        />
                      ) : (
                        <a
                          key={li}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label} <FiExternalLink aria-hidden="true" />
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ---------- Projects ---------- */}
        <section className="cv-section">
          <h2 className="cv-section-title">Projects &amp; Open Source</h2>
          {projects.map((proj, i) => (
            <div key={i} className="cv-entry">
              <div className="cv-entry-head">
                <h3 className="cv-entry-role">
                  {proj.title}
                  {proj.status && <span className="cv-pill" style={{ marginLeft: '10px' }}>{proj.status}</span>}
                </h3>
                <span className="cv-entry-period">{proj.category}</span>
              </div>
              <ul className="cv-bullets">
                <li>{proj.description}</li>
                <li>{proj.outcome}</li>
              </ul>
              {((proj.links && proj.links.length > 0) || (proj.slug && proj.caseStudy)) && (
                <div className="cv-entry-links">
                  {proj.slug && proj.caseStudy && (
                    <Link to={`/work/${proj.slug}`}>
                      Read case study <FiArrowRight aria-hidden="true" />
                    </Link>
                  )}
                  {proj.links && proj.links.map((link, li) => (
                    <a key={li} href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.label} <FiExternalLink aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ---------- Education ---------- */}
        <section className="cv-section">
          <h2 className="cv-section-title">Education</h2>
          {education.map((edu, i) => (
            <div key={i} className="cv-entry">
              <div className="cv-entry-head">
                <p className="cv-edu-degree">{edu.degree}</p>
                <span className="cv-entry-period">{edu.year}</span>
              </div>
              <p className="cv-edu-meta">{edu.school}</p>
            </div>
          ))}
        </section>

        {/* ---------- Contact ---------- */}
        <section className="cv-section" id="contact">
          <h2 className="cv-section-title">Get in Touch</h2>
          <p className="cv-summary">
            Have a role, project, or research idea in mind? Send a message and I'll get back to you.
          </p>
          <button
            type="button"
            className="cv-contact-cta"
            onClick={() => setContactOpen(true)}
          >
            Send a message
          </button>
        </section>
      </main>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} variant="cv" />
    </div>
  );
};

export default NormalModeLayout;
