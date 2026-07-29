import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiExternalLink, FiLink } from 'react-icons/fi';
import { getProjectsData, getProjectBySlug } from '../../entities/portfolio/model';
import { useContent } from '../../shared/lib/contentStore';
import SEO from '../../shared/ui/SEO';
import './caseStudy.css';

/*
 * CaseStudyPage — the detail page for a single project, at /work/:projectSlug.
 * Content lives in content.json under each project's `caseStudy`; this component
 * is presentation only.
 *
 * Laid out as a long-form article rather than a page of boxes, because the
 * write-ups run 1,000–1,700 words across 8–12 sections. That length needs three
 * things a flat stack of blocks doesn't give you: somewhere to see where you
 * are (the sticky index + progress bar), somewhere to jump to (anchored,
 * numbered headings), and a consistent vertical rhythm so scanning works.
 *
 * All spacing derives from the four --cs-flow-* tokens in caseStudy.css. Blocks
 * never set their own bottom margins — the container's flex gap owns it, so a
 * project missing a status pill, links, highlights or a gallery still reads with
 * exactly the same rhythm as one that has all four.
 */

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

/*
 * Showcase media — [{type, url, alt, caption, poster?}] uploaded from the admin.
 * Videos carry `controls` and never autoplay: an unprompted moving image is
 * hostile on a text page and costs mobile data. `preload="metadata"` keeps a
 * page with several clips from fetching any of them until asked.
 */
const MediaGrid = ({ items, className = '' }) => {
  const list = (items ?? []).filter((m) => m && m.url);
  if (!list.length) return null;

  return (
    <div className={`cs-media${list.length === 1 ? ' cs-media-single' : ''} ${className}`.trim()}>
      {list.map((m, i) => (
        <figure className="cs-media-item" key={`${m.url}-${i}`}>
          {m.type === 'video' ? (
            <video
              src={m.url}
              poster={m.poster || undefined}
              controls
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={m.alt || m.caption || 'Project demo clip'}
            />
          ) : (
            <img src={m.url} alt={m.alt || ''} loading="lazy" decoding="async" />
          )}
          {m.caption && <figcaption>{m.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
};

/** First still image anywhere in the case study — used as the social card. */
const shareImage = (caseStudy) => {
  const pools = [caseStudy?.media, ...(caseStudy?.sections ?? []).map((s) => s.media)];
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

  // Only projects with a written case study join the prev/next chain.
  const chain = getProjectsData().filter((p) => p.slug && p.caseStudy);

  // No useMemo: the React Compiler is enabled for this project and handles
  // memoization, and useActiveSection depends on the joined ids rather than the
  // array identity — so rebuilding this list each render costs nothing.
  const sections = project?.caseStudy?.sections ?? [];
  const seenIds = new Map();
  const ids = sections.map((s, i) => sectionId(s.heading, i, seenIds));

  const active = useActiveSection(ids);

  // Reading progress. Spring-smoothed so the bar glides instead of stepping.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });

  useEffect(() => {
    window.scrollTo(0, 0);
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
      <motion.div className="cs-progress" style={{ scaleX: progress }} aria-hidden="true" />

      <div className="cs-shell">
        {/* ── sidebar: back, section index, at-a-glance meta ── */}
        <aside className="cs-aside">
          <div className="cs-aside-inner">
            <Link to="/normal" className="cs-back">
              <FiArrowLeft aria-hidden="true" /> All work
            </Link>

            {ids.length > 1 && (
              <nav className="cs-toc" aria-label="Sections">
                <p className="cs-toc-label">Contents</p>
                <ol>
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
            <motion.div className="cs-wip" role="note" {...fade(0)}>
              <span className="cs-wip-badge">Work in progress</span>
              <span className="cs-wip-text">
                This case study is still being written — details may be incomplete or change.
              </span>
            </motion.div>
          )}

          {/* hero — its own flex column so eyebrow/title/tagline stay tight
              together instead of inheriting the between-blocks gap */}
          <motion.header className="cs-hero" {...fade(0.04)}>
            <p className="cs-eyebrow">{category}</p>
            <h1 className="cs-title">
              {title}
              {status && <span className="cs-status">{status}</span>}
            </h1>
            {tagline && <p className="cs-tagline">{tagline}</p>}

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
          </motion.header>

          {stack && stack.length > 0 && (
            <motion.div className="cs-stack" {...fade(0.08)}>
              {stack.map((tech) => (
                <span key={tech} className="cs-chip">{tech}</span>
              ))}
            </motion.div>
          )}

          {highlights && highlights.length > 0 && (
            <motion.div className="cs-highlights" {...fade(0.12)}>
              {highlights.map((h, i) => (
                <div key={i} className="cs-highlight">
                  <span className="cs-highlight-num">{String(i + 1).padStart(2, '0')}</span>
                  <p>{h}</p>
                </div>
              ))}
            </motion.div>
          )}

          {caseStudy.media && caseStudy.media.length > 0 && (
            <motion.div {...fade(0.16)}>
              <MediaGrid items={caseStudy.media} className="cs-media-gallery" />
            </motion.div>
          )}

          {sections.map((section, i) => (
            <motion.section
              key={ids[i]}
              id={ids[i]}
              className="cs-section"
              initial={{ y: 22, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
            </motion.section>
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
