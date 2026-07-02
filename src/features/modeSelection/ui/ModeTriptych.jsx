import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiMail, FiGlobe, FiSend, FiArrowRight } from 'react-icons/fi';
import content from '../../../data/content.json';
import ContactModal from '../../../shared/ui/ContactModal';
import './ModeTriptych.css';

/*
 * ModeTriptych: the landing page as three full-height "doors", one per mode.
 *
 * Each door is a real router <Link> styled to look like the page behind it
 * (paper résumé / aurora portfolio / terminal), so middle-click, new-tab and
 * keyboard all work natively — no global key handling is needed to enter.
 * A plain left click plays a short "door swallows the screen" grow (~430ms)
 * before navigating; reduced-motion visitors navigate instantly.
 *
 * Digits 1-3 are a convenience shortcut only — they never preventDefault, so
 * they can't break focused buttons the way the old arcade HUD's handler did.
 */

const DOORS = [
  {
    id: 'resume',
    to: '/cv',
    name: 'Résumé',
    sub: 'The 2-minute version',
  },
  {
    id: 'portfolio',
    to: '/normal',
    name: 'Portfolio',
    sub: 'The full experience',
  },
  {
    id: 'terminal',
    to: '/terminal',
    name: 'Terminal',
    sub: 'For fellow developers',
  },
];

// how long the door-open grow plays before navigation (must stay a touch
// shorter than the CSS flex-grow transition so the cut never feels abrupt)
const OPEN_MS = 430;

const { personal, contact } = content.common;
const SOCIALS = [
  { id: 'github', label: 'GitHub', href: contact.githubUrl, Icon: FiGithub },
  { id: 'linkedin', label: 'LinkedIn', href: contact.linkedinUrl, Icon: FiLinkedin },
  { id: 'email', label: 'Email', href: `mailto:${contact.email}`, Icon: FiMail },
  { id: 'website', label: 'Website', href: `https://${contact.website}`, Icon: FiGlobe },
].filter((s) => s.href);

/* ---- per-door decorative art (all aria-hidden by the wrapper) ---- */

function PaperArt() {
  return (
    <div className="tri-paper">
      <div className="tri-paper-sheet">
        <span className="tri-paper-heading" />
        <span className="tri-paper-rule" />
      </div>
    </div>
  );
}

function AuroraArt() {
  return (
    <div className="tri-aurora">
      <span className="tri-blob tri-blob--teal" />
      <span className="tri-blob tri-blob--amber" />
      <span className="tri-blob tri-blob--violet" />
    </div>
  );
}

function TerminalArt() {
  return (
    <div className="tri-term">
      <div className="tri-term-line">~$ whoami</div>
      <div className="tri-term-line tri-term-line--out">agrim · full-stack dev</div>
      <div className="tri-term-line">
        ~$&nbsp;<span className="tri-term-caret" />
      </div>
    </div>
  );
}

const DOOR_ART = {
  resume: <PaperArt />,
  portfolio: <AuroraArt />,
  terminal: <TerminalArt />,
};

export default function ModeTriptych() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const beginOpen = useCallback(
    (door) => {
      if (opening) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        navigate(door.to);
        return;
      }
      setOpening(door.id);
      timerRef.current = setTimeout(() => navigate(door.to), OPEN_MS);
    },
    [opening, navigate]
  );

  const handleClick = (e, door) => {
    // modified clicks (new tab etc.) keep native link behaviour
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    beginOpen(door);
  };

  /* digits 1-3 jump straight through a door */
  useEffect(() => {
    const onKey = (e) => {
      if (contactOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = ['1', '2', '3'].indexOf(e.key);
      if (idx === -1) return;
      const t = e.target;
      if (t?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      beginOpen(DOORS[idx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beginOpen, contactOpen]);

  return (
    <main className={`tri-root ${opening ? 'is-opening' : ''}`}>
      <header className="tri-header">
        <h1 className="tri-name">{personal.name}</h1>
        <p className="tri-tagline">{personal.tagline}</p>
        {personal.intro && <p className="tri-intro">{personal.intro}</p>}
      </header>

      <nav className="tri-doors" aria-label="Choose how to view this site">
        {DOORS.map((door, i) => (
          <Link
            key={door.id}
            to={door.to}
            className={`tri-door tri-door--${door.id} ${opening === door.id ? 'is-chosen' : ''}`}
            style={{ '--tri-delay': `${i * 90}ms` }}
            onClick={(e) => handleClick(e, door)}
          >
            <div className="tri-door-art" aria-hidden="true">
              {DOOR_ART[door.id]}
            </div>
            <div className="tri-door-body">
              <span className="tri-door-index" aria-hidden="true">
                0{i + 1}
              </span>
              <span className="tri-door-name">{door.name}</span>
              <span className="tri-door-sub">{door.sub}</span>
              <span className="tri-door-cta">
                Enter <FiArrowRight aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </nav>

      <footer className="tri-footer">
        <nav className="tri-socials" aria-label="Social links">
          {SOCIALS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              target={s.id === 'email' ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="tri-social"
              aria-label={s.label}
              title={s.label}
            >
              <s.Icon aria-hidden="true" />
            </a>
          ))}
        </nav>
        <button
          type="button"
          className="tri-contact-btn"
          onClick={() => setContactOpen(true)}
        >
          <FiSend aria-hidden="true" />
          <span>Contact</span>
        </button>
        <p className="tri-hint">
          press <kbd>1</kbd>–<kbd>3</kbd> to jump straight in
        </p>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} variant="terminal" />
    </main>
  );
}
