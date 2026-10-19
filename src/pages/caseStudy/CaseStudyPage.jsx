import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion as Motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiExternalLink, FiLink } from 'react-icons/fi';
import { getProjectsData, getProjectBySlug } from '../../entities/portfolio/model';
import { useContent } from '../../shared/lib/contentStore';
import SEO from '../../shared/ui/SEO';
import MediaGrid from './CaseStudyMedia';
import ProjectWalkthrough from './ProjectWalkthrough';
import './caseStudy.css';

// Case-study content and walkthroughs stay editable through the CMS.

const fade = (delay = 0) => ({
  initial: { y: 18, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay },
});

/* Stable, readable anchor ids from headings, deduped so two sections that
   normalise to the same slug can't collide. */
const sectionId = (heading, i, seen) => {
  const base =
    String(heading || `section-${i + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `section-${i + 1}`;
  const n = (seen.get(base) ?? 0) + 1;
  seen.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
};

/*
 * Section bodies are plain text in the admin, but technical write-ups need
 * paragraph breaks. A blank line splits; a single newline doesn't, so wrapped
 * typing in the textarea stays one paragraph.
 */
const paragraphs = (body) =>
  String(body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** First still image anywhere in the case study — used as the social card. */
const shareImage = (caseStudy) => {
  const pools = [caseStudy?.media, ...(caseStudy?.walkthrough?.steps ?? []).map((s) => s.media), ...(caseStudy?.sections ?? []).map((s) => s.media)];
  for (const pool of pools) {
    const hit = (pool ?? []).find((m) => m?.url && m.type !== 'video');
    if (hit) return hit.url;
  }
  return undefined;
};

/*
 * Marks the section currently under the top of the viewport. rootMargin pulls
 * the trip line down to ~28% so a heading counts as "current" once it's near
 * the top, not when it first peeks in from the bottom — which is what makes the
 * index track reading rather than scrolling.
 */
function useActiveSection(ids) {
  // Depend on a joined string rather than the array: `ids` is rebuilt every
  // render, and using its identity would tear down and re-create the observer
  // on each one. The string only changes when the sections actually change.
  const key = ids.join('|');
  const [active, setActive] = useState(null);
  const visible = useRef(new Set());

  useEffect(() => {
    const list = key ? key.split('|') : [];
    if (!list.length || typeof IntersectionObserver === 'undefined') return undefined;
    visible.current = new Set();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.current.add(e.target.id);
          else visible.current.delete(e.target.id);
        });
        // Several sections can straddle the band at once; the earliest in
        // document order is the one being read.
        const current = list.find((id) => visible.current.has(id));
        if (current) setActive(current);
      },
      { rootMargin: '-28% 0px -60% 0px', threshold: 0 }
    );

    list.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [key]);

  // Derived, not stored: navigating to another project changes `ids` and the
  // stale value falls back to the first section without a setState-in-effect.
  return ids.includes(active) ? active : ids[0];
}

const CaseStudyPage = () => {
  useContent(); // re-render when content changes
  const { projectSlug } = useParams();
  const project = getProjectBySlug(projectSlug);
  const reduceMotion = useReducedMotion();
  const entrance = (delay) => reduceMotion ? {} : fade(delay);

  // Only projects with a written case study join the prev/next chain.
  const chain = getProjectsData().filter((p) => p.slug && p.caseStudy);

  const sections = project?.caseStudy?.sections ?? [];
  const hasWalkthrough = Boolean(project?.caseStudy?.walkthrough?.steps?.length);
  const seenIds = new Map([['visual-walkthrough', 1]]);
  const ids = sections.map((s, i) => sectionId(s.heading, i, seenIds));

  const active = useActiveSection(hasWalkthrough ? ['visual-walkthrough', ...ids] : ids);

  // Reading progress. Spring-smoothed so the bar glides instead of stepping.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });

  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [projectSlug]);

  // Unknown slug, or a project without a case study -> back to the work grid.
  if (!project || !project.caseStudy) return <Navigate to="/normal" replace />;

  const { title, category, status, links, caseStudy } = project;
  const { tagline, role, stack, highlights } = caseStudy;

  // Case studies are drafts by default; a project opts out with `wip: false`.
  const isWip = caseStudy.wip !== false;

  const idx = chain.findIndex((p) => p.slug === project.slug);
  const prev = idx > 0 ? chain[idx - 1] : null;
  const next = idx >= 0 && idx < chain.length - 1 ? chain[idx + 1] : null;

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    // Keep the URL shareable without triggering the browser's own jump.
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="case-study">
      <SEO
        title={`${title} — Case Study · Agrim Sigdel`}
        description={tagline || project.pitch}
        url={`https://agrimsigdel.com.np/work/${project.slug}`}
        image={shareImage(caseStudy)}
      />

      {/* reading progress — decorative, so hidden from assistive tech */}
      <Motion.div className="cs-progress" style={{ scaleX: progress }} aria-hidden="true" />

      <div className="cs-shell">
        {/* ── sidebar: back, section index, at-a-glance meta ── */}
        <aside className="cs-aside">
          <div className="cs-aside-inner">
            <Link to="/work" className="cs-back">
              <FiArrowLeft aria-hidden="true" /> All work
            </Link>

            {ids.length > 1 && (
              <nav className="cs-toc" aria-label="Sections">
                <p className="cs-toc-label">Contents</p>
                <ol>
                  {hasWalkthrough && <li><a href="#visual-walkthrough" onClick={jumpTo('visual-walkthrough')} className={active === 'visual-walkthrough' ? 'is-active' : undefined} aria-current={active === 'visual-walkthrough' ? 'true' : undefined}><span className="cs-toc-num">↗</span><span className="cs-toc-text">Visual walkthrough</span></a></li>}
                  {sections.map((s, i) => (
                    <li key={ids[i]}>
                      <a
                        href={`#${ids[i]}`}
                        onClick={jumpTo(ids[i])}
                        className={active === ids[i] ? 'is-active' : undefined}
                        aria-current={active === ids[i] ? 'true' : undefined}
                      >
                        <span className="cs-toc-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="cs-toc-text">{s.heading}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {role && (
              <div className="cs-aside-meta">
                <span className="cs-meta-label">Role</span>
                <span className="cs-meta-value">{role}</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── the article ── */}
        <article className="cs-article">
          {isWip && (
            <Motion.div className="cs-wip" role="note" {...entrance(0)}>
              <span className="cs-wip-badge">Work in progress</span>
              <span className="cs-wip-text">
                This case study is still being written — details may be incomplete or change.
              </span>
            </Motion.div>
          )}

          {/* hero — its own flex column so eyebrow/title/tagline stay tight
              together instead of inheriting the between-blocks gap */}
          <Motion.header className="cs-hero" {...entrance(0.04)}>
            <p className="cs-eyebrow">{category}</p>
            <h1 className="cs-title">
              {title}
              {status && <span className="cs-status">{status}</span>}
            </h1>
            {tagline && <p className="cs-tagline">{tagline}</p>}
            <p className="cs-reading-time">{Math.max(1, Math.ceil([tagline, ...sections.map((s) => s.body), ...(caseStudy.walkthrough?.steps ?? []).map((s) => s.body)].join(' ').split(/\s+/).length / 200))} min read{hasWalkthrough && <> <span aria-hidden="true"> / </span> <a href="#visual-walkthrough" onClick={jumpTo('visual-walkthrough')}>Start with the walkthrough ↓</a></>}</p>

            {((links && links.length > 0) || role) && (
              <div className="cs-herometa">
                {role && <span className="cs-herometa-role">{role}</span>}
                {links && links.length > 0 && (
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
                )}
              </div>
            )}
          </Motion.header>

          {stack && stack.length > 0 && (
            <details className="cs-stack-details">
              <summary>Built with {stack.slice(0, 3).join(', ')}{stack.length > 3 ? ` + ${stack.length - 3} more` : ''}</summary>
              <div className="cs-stack">{stack.map((tech) => <span key={tech} className="cs-chip">{tech}</span>)}</div>
            </details>
          )}

          {highlights && highlights.length > 0 && (
            <Motion.div className="cs-highlights" {...entrance(0.12)}>
              {highlights.map((h, i) => (
                <div key={i} className="cs-highlight">
                  <span className="cs-highlight-num">{String(i + 1).padStart(2, '0')}</span>
                  <p>{h}</p>
                </div>
              ))}
            </Motion.div>
          )}

          {caseStudy.media && caseStudy.media.length > 0 && (
            <Motion.div {...entrance(0.16)}>
              <MediaGrid items={caseStudy.media} className="cs-media-gallery" priority />
            </Motion.div>
          )}

          <ProjectWalkthrough walkthrough={caseStudy.walkthrough} />

          {sections.map((section, i) => (
            <Motion.section
              key={ids[i]}
              id={ids[i]}
              className="cs-section"
            >
              <h2 className="cs-section-heading">
                <span className="cs-section-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="cs-section-title">{section.heading}</span>
                <a
                  href={`#${ids[i]}`}
                  className="cs-anchor"
                  onClick={jumpTo(ids[i])}
                  aria-label={`Link to “${section.heading}”`}
                >
                  <FiLink aria-hidden="true" />
                </a>
              </h2>

              {section.body && (
                <div className="cs-section-prose">
                  {paragraphs(section.body).map((p, pi) => (
                    <p className="cs-section-body" key={pi}>{p}</p>
                  ))}
                </div>
              )}

              {section.bullets && section.bullets.length > 0 && (
                <ul className="cs-section-bullets">
                  {section.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              )}

              <MediaGrid items={section.media} />
            </Motion.section>
          ))}

          {(prev || next) && (
            <nav className="cs-nav" aria-label="More projects">
              {prev ? (
                <Link to={`/work/${prev.slug}`} className="cs-nav-link prev">
                  <span className="cs-nav-dir"><FiArrowLeft aria-hidden="true" /> Previous</span>
                  <span className="cs-nav-title">{prev.title}</span>
                </Link>
              ) : <span className="cs-nav-spacer" />}
              {next ? (
                <Link to={`/work/${next.slug}`} className="cs-nav-link next">
                  <span className="cs-nav-dir">Next <FiArrowRight aria-hidden="true" /></span>
                  <span className="cs-nav-title">{next.title}</span>
                </Link>
              ) : <span className="cs-nav-spacer" />}
            </nav>
          )}
        </article>
      </div>
    </div>
  );
};

export default CaseStudyPage;
