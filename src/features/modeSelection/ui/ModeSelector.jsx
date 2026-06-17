import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiVolume2,
  FiVolumeX,
  FiChevronLeft,
  FiChevronRight,
  FiGithub,
  FiLinkedin,
  FiMail,
  FiGlobe,
  FiSend,
} from 'react-icons/fi';
import content from '../../../data/content.json';
import ContactModal from '../../../shared/ui/ContactModal';
import CssCosmicField from './CssCosmicField';
import CssPortal from './CssPortal';
import ChargeRing from './ChargeRing';
// Three.js-backed visuals are split into their own chunk and only fetched when
// WebGL is available — no-WebGL visitors never download three/r3f at all.
const BioluminescentField = lazy(() => import('./BioluminescentField'));
const ModePortal = lazy(() => import('./ModePortal'));
const PortalWarp = lazy(() => import('./PortalWarp'));
import useVisitedModes from './useVisitedModes';
import useWebGL from './useWebGL';
import {
  isMuted,
  toggleMuted,
  playHover,
  playChargeTick,
  playLaunch,
  playUnlock,
} from './arcadeSound';
import './ModeSelector.css';

/*
 * ModeSelector: an arcade-style "SELECT MODE" screen.
 *
 * The screen is framed as a game-select HUD. All three modes live in a selector
 * strip; the highlighted one blows up into a single large "preview" panel with
 * its portal, tagline, tags and a CLEARED/NEW badge. You move with the arrows
 * (or 1-3), and HOLD enter (or hover) to charge a ring that launches you through
 * a hyperspace warp into the chosen page.
 *
 * Resilience: every visual that needs three.js (backdrop, portal, warp) is gated
 * on useWebGL(). With no WebGL we render a CSS-only "cosmic-lite" build — same
 * layout, same mechanics, just lighter visuals — so the menu is never a black
 * void.
 *
 * Game feel: keyboard nav, hold-to-charge launch, synthesized arcade sound
 * (muted by default, opt-in), and persisted "visited" tracking with an unlock
 * intro.
 */

const MODES = [
  {
    id: 'normal',
    label: 'CV',
    sub: 'The professional record',
    color: '#23d3c0',
    tags: ['résumé', 'structured', 'formal'],
  },
  {
    id: 'fun',
    label: 'Normal',
    sub: 'Fluid dynamics',
    color: '#f0a040',
    tags: ['interactive', 'motion', 'playful'],
  },
  {
    id: 'work',
    label: 'Terminal',
    sub: 'Built for developers',
    // brighter emerald — the old #046824 read muddy against the dark HUD
    color: '#2bd46a',
    tags: ['technical', 'cli', 'data'],
  },
];

// how long a card must stay charged before it launches (ms)
const CHARGE_MS = 700;

// identity + social links, pulled from the shared content so the landing page
// stays consistent with the rest of the site (same name, tagline, URLs).
const { personal, contact } = content.common;
const SOCIALS = [
  { id: 'github', label: 'GitHub', href: contact.githubUrl, Icon: FiGithub },
  { id: 'linkedin', label: 'LinkedIn', href: contact.linkedinUrl, Icon: FiLinkedin },
  { id: 'email', label: 'Email', href: `mailto:${contact.email}`, Icon: FiMail },
  { id: 'website', label: 'Website', href: `https://${contact.website}`, Icon: FiGlobe },
].filter((s) => s.href);

export default function ModeSelector({ onSelectMode }) {
  const webgl = useWebGL(); // null = probing, true/false once known

  // `active` is the focused mode index (default 0 so the preview is never empty)
  const [active, setActive] = useState(0);
  const [selecting, setSelecting] = useState(null);
  const [charging, setCharging] = useState(null);
  const [progress, setProgress] = useState(0);
  const [muted, setMutedState] = useState(() => isMuted());
  const [contactOpen, setContactOpen] = useState(false);

  const { visited, markVisited } = useVisitedModes();

  // sequential "unlock" intro — cards reveal locked→unlocked one by one
  const [unlocked, setUnlocked] = useState(() => MODES.map(() => false));

  const rafRef = useRef(null);
  const chargeStartRef = useRef(0);
  const lastTickRef = useRef(0);

  /* ---- unlock intro ---- */
  useEffect(() => {
    const timers = MODES.map((_, i) =>
      setTimeout(() => {
        setUnlocked((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        playUnlock();
      }, 700 + i * 280)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  /* ---- charge helpers ---- */
  const stopCharge = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setCharging(null);
    setProgress(0);
  }, []);

  const launch = useCallback(
    (index) => {
      const mode = MODES[index];
      if (!mode || selecting) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setCharging(null);
      setProgress(0);
      setSelecting(mode.id);
      markVisited(mode.id);
      playLaunch();
      setTimeout(() => onSelectMode(mode.id), 1500);
    },
    [selecting, markVisited, onSelectMode]
  );

  const beginCharge = useCallback(
    (index) => {
      if (selecting || index == null || !unlocked[index]) return;
      if (charging === index) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setCharging(index);
      chargeStartRef.current = performance.now();
      lastTickRef.current = 0;

      const stepCharge = (now) => {
        const p = Math.min(1, (now - chargeStartRef.current) / CHARGE_MS);
        setProgress(p);
        if (now - lastTickRef.current > 90) {
          lastTickRef.current = now;
          playChargeTick(p);
        }
        if (p >= 1) {
          rafRef.current = null;
          launch(index);
          return;
        }
        rafRef.current = requestAnimationFrame(stepCharge);
      };
      rafRef.current = requestAnimationFrame(stepCharge);
    },
    [selecting, unlocked, charging, launch]
  );

  /* ---- focus a mode (shared by strip clicks + keyboard) ---- */
  const focusMode = useCallback(
    (index, { silent = false } = {}) => {
      if (selecting) return;
      stopCharge();
      setActive((cur) => {
        if (cur !== index && !silent) playHover();
        return index;
      });
    },
    [selecting, stopCharge]
  );

  /* ---- keyboard navigation ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (selecting) return;

      if (e.key >= '1' && e.key <= String(MODES.length)) {
        const idx = Number(e.key) - 1;
        focusMode(idx);
        beginCharge(idx);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusMode((active + 1) % MODES.length);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusMode((active - 1 + MODES.length) % MODES.length);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        beginCharge(active);
        return;
      }
      if (e.key === 'Escape') stopCharge();
    };
    const onKeyUp = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && progress < 1) stopCharge();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selecting, active, progress, focusMode, beginCharge, stopCharge]);

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);

  const handleMuteToggle = () => {
    const nowMuted = toggleMuted();
    setMutedState(nowMuted);
    if (!nowMuted) playUnlock();
  };

  const current = MODES[active];
  const selected = MODES.find((m) => m.id === selecting);
  const isCurrentUnlocked = unlocked[active];
  const isCurrentVisited = visited.has(current.id);

  // hold gestures on the big preview / enter button
  const holdStart = () => beginCharge(active);
  const holdEnd = () => progress < 1 && stopCharge();

  return (
    <motion.div
      className={`ms-root ms-arcade ${webgl === false ? 'is-lite' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Backdrop: three.js when available, CSS cosmic-lite otherwise. While the
          WebGL probe is pending (null) we show the CSS field to avoid a flash. */}
      {webgl ? (
        <Suspense fallback={<CssCosmicField />}>
          <BioluminescentField />
        </Suspense>
      ) : (
        <CssCosmicField />
      )}

      {/* HUD frame — fades out once a mode is chosen so only the transition
          shows over the nebula */}
      <motion.div
        className="ms-hud"
        animate={{ opacity: selecting ? 0 : 1, scale: selecting ? 0.96 : 1 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ pointerEvents: selecting ? 'none' : 'auto' }}
      >
        {/* ---- top bar ---- */}
        <header className="ms-hud-top">
          <div className="ms-hud-title">
            <span className="ms-hud-bracket">[</span>
            SELECT&nbsp;MODE
            <span className="ms-hud-bracket">]</span>
          </div>

          <button
            type="button"
            className="ms-sound-toggle"
            onClick={handleMuteToggle}
            aria-pressed={!muted}
            aria-label={muted ? 'Turn on sound' : 'Mute sound'}
            title={muted ? 'Turn on sound for the full experience' : 'Mute'}
          >
            {muted ? <FiVolumeX aria-hidden="true" /> : <FiVolume2 aria-hidden="true" />}
            {muted && <span className="ms-sound-pulse-dot" />}
          </button>
        </header>

        {/* ---- identity ---- */}
        <div className="ms-identity">
          <h1 className="ms-identity-name">{personal.name}</h1>
          <p className="ms-identity-tagline">{personal.tagline}</p>

        </div>

        {/* ---- selector strip ---- */}
        <div className="ms-strip" role="tablist" aria-label="Choose a mode">
          <button
            type="button"
            className="ms-strip-arrow"
            aria-label="Previous mode"
            onClick={() => focusMode((active - 1 + MODES.length) % MODES.length)}
          >
            <FiChevronLeft aria-hidden="true" />
          </button>

          <div className="ms-strip-tabs">
            {MODES.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`ms-strip-tab ${active === i ? 'is-active' : ''} ${unlocked[i] ? '' : 'is-locked'}`}
                style={{ '--mode-color': m.color }}
                onMouseEnter={() => focusMode(i)}
                onFocus={() => focusMode(i)}
                onClick={() => focusMode(i)}
              >
                <span className="ms-strip-tab-idx">0{i + 1}</span>
                <span className="ms-strip-tab-label">{m.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ms-strip-arrow"
            aria-label="Next mode"
            onClick={() => focusMode((active + 1) % MODES.length)}
          >
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="ms-strip-counter">
          {String(active + 1).padStart(2, '0')} / {String(MODES.length).padStart(2, '0')}
        </div>

        {/* ---- focused preview ---- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="ms-preview"
            style={{ '--mode-color': current.color }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ms-preview-badges">
              {isCurrentVisited ? (
                <span className="ms-badge ms-badge--cleared">✓ Cleared</span>
              ) : (
                <span className="ms-badge ms-badge--new">★ New</span>
              )}
              {!webgl && <span className="ms-badge ms-badge--lite">Lite</span>}
            </div>

            <div
              className="ms-preview-portal"
              onMouseDown={holdStart}
              onMouseUp={holdEnd}
              onMouseLeave={holdEnd}
              onTouchStart={holdStart}
              onTouchEnd={holdEnd}
            >
              {webgl ? (
                <Suspense
                  fallback={
                    <div className="ms-portal-canvas" style={{ width: '100%', height: '100%' }}>
                      <CssPortal
                        variant={current.id}
                        color={current.color}
                        hot
                        charge={charging === active ? progress : 0}
                      />
                    </div>
                  }
                >
                  <ModePortal
                    variant={current.id}
                    color={current.color}
                    hot
                    charge={charging === active ? progress : 0}
                    webgl
                  />
                </Suspense>
              ) : (
                <div className="ms-portal-canvas" style={{ width: '100%', height: '100%' }}>
                  <CssPortal
                    variant={current.id}
                    color={current.color}
                    hot
                    charge={charging === active ? progress : 0}
                  />
                </div>
              )}
              {charging === active && (
                <div className="ms-charge-ring-wrap">
                  <ChargeRing progress={progress} color={current.color} />
                </div>
              )}
            </div>

            <h2 className="ms-preview-name">{current.label}</h2>
            <p className="ms-preview-sub">{current.sub}</p>

            <div className="ms-preview-tags">
              {current.tags.map((t) => (
                <span key={t} className="ms-tag">{t}</span>
              ))}
            </div>

            {/* hold-to-enter bar */}
            <button
              type="button"
              className="ms-enter-btn"
              disabled={!isCurrentUnlocked}
              onMouseDown={holdStart}
              onMouseUp={holdEnd}
              onMouseLeave={holdEnd}
              onTouchStart={holdStart}
              onTouchEnd={holdEnd}
              onClick={() => launch(active)}
            >
              <span
                className="ms-enter-fill"
                style={{ width: `${(charging === active ? progress : 0) * 100}%` }}
              />
              <span className="ms-enter-label">
                {isCurrentUnlocked ? 'Hold to enter' : 'Locked'}
              </span>
            </button>
          </motion.div>
        </AnimatePresence>

        {/* ---- controls legend ---- */}
        <footer className="ms-hud-legend">
          <span><kbd>←</kbd><kbd>→</kbd> move</span>
          <span className="ms-legend-dot">·</span>
          <span><kbd>1</kbd>–<kbd>3</kbd> jump</span>
          <span className="ms-legend-dot">·</span>
          <span>hold <kbd>⏎</kbd> launch</span>
          {muted && (
            <>
              <span className="ms-legend-dot">·</span>
              <button type="button" className="ms-legend-sound" onClick={handleMuteToggle}>
                turn on sound for the full experience
              </button>
            </>
          )}
        </footer>
      </motion.div>

      {/* ---- floating social links — also fade out during the transition ---- */}
      <motion.nav
        className="ms-socials"
        aria-label="Social links"
        initial={{ opacity: 0, y: 16 }}
        animate={selecting ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
        transition={selecting ? { duration: 0.4, ease: 'easeInOut' } : { delay: 1.1, duration: 0.7 }}
        style={{ pointerEvents: selecting ? 'none' : 'auto' }}
      >
        {SOCIALS.map(({ id, label, href, Icon }) => (
          <a
            key={id}
            href={href}
            target={id === 'email' ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="ms-social"
            aria-label={label}
            title={label}
          >
            <Icon aria-hidden="true" />
          </a>
        ))}

        <span className="ms-social-divider" aria-hidden="true" />

        <button
          type="button"
          className="ms-contact-btn"
          onClick={() => setContactOpen(true)}
          title="Send a message"
        >
          <FiSend aria-hidden="true" />
          <span>Contact</span>
        </button>
      </motion.nav>

      {/* Shared contact modal — terminal/arcade-themed to match the HUD. */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} variant="terminal" />

      {/* ---- launch transition: WebGL warp, or a CSS flash in lite mode ---- */}
      <AnimatePresence>
        {selecting && (
          <motion.div
            className="ms-warp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(circle at center, color-mix(in srgb, ${selected?.color} 18%, transparent), #000000 68%)`,
            }}
          >
            {webgl ? (
              <Suspense fallback={null}>
                <PortalWarp variant={selecting} color={selected?.color || '#7c6cff'} />
              </Suspense>
            ) : (
              <div
                className={`ms-warp-lite ms-warp-lite--${selecting}`}
                style={{ '--mode-color': selected?.color || '#7c6cff' }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
