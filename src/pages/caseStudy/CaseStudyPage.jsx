import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiExternalLink } from 'react-icons/fi';
import { projectsData, getProjectBySlug } from '../../entities/portfolio/model';
import SEO from '../../shared/ui/SEO';
import './caseStudy.css';

/*
 * CaseStudyPage — the dedicated detail page for a single project, reachable at
 * /work/:projectSlug. Content lives in content.json under each project's
 * `caseStudy` field; this component is pure presentation.
 */

// Only projects that actually have a case study are part of the prev/next chain.
const chain = projectsData.filter((p) => p.slug && p.caseStudy);

const fade = (delay = 0) => ({
  initial: { y: 24, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay },
});

const CaseStudyPage = () => {
  const { projectSlug } = useParams();
  const project = getProjectBySlug(projectSlug);

  // Unknown slug, or a project without a written case study -> back to the work grid.
  if (!project || !project.caseStudy) return <Navigate to="/normal" replace />;

  const { title, category, status, links, caseStudy } = project;
  const { tagline, role, stack, highlights, sections } = caseStudy;

  // Case studies are drafts by default; a project can opt out with `wip: false`.
  const isWip = caseStudy.wip !== false;

  const idx = chain.findIndex((p) => p.slug === project.slug);
  const prev = idx > 0 ? chain[idx - 1] : null;
  const next = idx >= 0 && idx < chain.length - 1 ? chain[idx + 1] : null;

  return (
    <div className="case-study">
      <SEO
        title={`${title} — Case Study · Agrim Sigdel`}
        description={tagline || project.pitch}
        url={`https://agrimsigdel.com.np/work/${project.slug}`}
      />

      <div className="cs-container">
        {/* top bar */}
        <div className="cs-topbar">
          <Link to="/normal" className="cs-back">
            <FiArrowLeft aria-hidden="true" /> All work
          </Link>
        </div>

        {/* work-in-progress notice */}
        {isWip && (
          <motion.div className="cs-wip" role="note" {...fade(0)}>
            <span className="cs-wip-badge">Work in progress</span>
            <span className="cs-wip-text">
              This case study is still being written — details may be incomplete or change.
            </span>
          </motion.div>
        )}

        {/* hero */}
        <motion.p className="cs-eyebrow" {...fade(0)}>{category}</motion.p>
        <motion.h1 className="cs-title" {...fade(0.05)}>
          {title}
          {status && <span className="cs-status">{status}</span>}
        </motion.h1>
        {tagline && (
          <motion.p className="cs-tagline" {...fade(0.1)}>{tagline}</motion.p>
        )}

        {/* meta: role + links */}
        <motion.div className="cs-meta" {...fade(0.15)}>
          {role && (
            <div className="cs-meta-item">
              <span className="cs-meta-label">Role</span>
              <span className="cs-meta-value">{role}</span>
            </div>
          )}
          {links && links.length > 0 && (
            <div className="cs-meta-item" style={{ flex: 1 }}>
              <span className="cs-meta-label">Links</span>
              <div className="cs-links">
                {links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cs-link"
                  >
                    {link.label} <FiExternalLink aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* stack chips */}
        {stack && stack.length > 0 && (
          <motion.div className="cs-stack" {...fade(0.2)}>
            {stack.map((tech) => (
              <span key={tech} className="cs-chip">{tech}</span>
            ))}
          </motion.div>
        )}

        {/* highlights */}
        {highlights && highlights.length > 0 && (
          <motion.div className="cs-highlights" {...fade(0.25)}>
            {highlights.map((h, i) => (
              <div key={i} className="cs-highlight">{h}</div>
            ))}
          </motion.div>
        )}

        {/* body sections */}
        {sections && sections.map((section) => (
          <motion.section
            key={section.heading}
            className="cs-section"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="cs-section-heading">{section.heading}</h2>
            {section.body && <p className="cs-section-body">{section.body}</p>}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="cs-section-bullets">
                {section.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
              </ul>
            )}
          </motion.section>
        ))}

        {/* prev / next */}
        {(prev || next) && (
          <nav className="cs-nav" aria-label="More projects">
            {prev ? (
              <Link to={`/work/${prev.slug}`} className="cs-nav-link prev">
                <span className="cs-nav-dir"><FiArrowLeft aria-hidden="true" /> Previous</span>
                <span className="cs-nav-title">{prev.title}</span>
              </Link>
            ) : <span className="cs-nav-link" style={{ visibility: 'hidden' }} />}
            {next ? (
              <Link to={`/work/${next.slug}`} className="cs-nav-link next">
                <span className="cs-nav-dir">Next <FiArrowRight aria-hidden="true" /></span>
                <span className="cs-nav-title">{next.title}</span>
              </Link>
            ) : <span className="cs-nav-link" style={{ visibility: 'hidden' }} />}
          </nav>
        )}
      </div>
    </div>
  );
};

export default CaseStudyPage;
