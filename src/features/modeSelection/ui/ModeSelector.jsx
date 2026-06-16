import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BioluminescentField from './BioluminescentField';
import ModePortal from './ModePortal';
import PortalWarp from './PortalWarp';
import './ModeSelector.css';

/*
 * ModeSelector: deep-space entry screen.
 *
 * A full-screen voronoi backdrop (BioluminescentField) with three glass cards
 * floating on top. Each card holds an interactive 3D PortalRing (ModePortal)
 * that opens and spins faster on hover. Picking a mode plays a glide-through-
 * the-portal transition (PortalWarp) before handing off to the page.
 *
 * Aurora palette: one indigo family graded from seafoam through periwinkle to
 * violet, so the three modes read as a designed set rather than primary colors.
 */

/*
 * Each mode is its own little world:
 *   normal -> teal "orbits"   (structured, formal)
 *   fun    -> amber "galaxy"   (playful, alive)
 *   work   -> green "data-net" (technical)
 *
 * `color` is a clean solid hex used by both the 3D portal (three.js needs a
 * valid color, not an 8-digit alpha hex) and the card glow via color-mix().
 */
const MODES = [
  {
    id: 'normal',
    label: 'Curriculum',
    sub: 'The professional record',
    color: '#23d3c0',
  },
  {
    id: 'fun',
    label: 'Immerse',
    sub: 'The interactive experience',
    color: '#f0a040',
  },
  {
    id: 'work',
    label: 'Terminal',
    sub: 'Built for developers',
    color: '#37c463',
  },
];

export default function ModeSelector({ onSelectMode }) {
  const [hovered, setHovered] = useState(null);
  const [selecting, setSelecting] = useState(null);

  const handleSelect = (mode) => {
    if (selecting) return;
    setSelecting(mode);
    // let the glide-through-portal transition play before the page mounts.
    // matches the ~1.4s ease in PortalWarp; a touch of extra time lets the
    // white flash peak before we hand off so the cut is invisible.
    setTimeout(() => onSelectMode(mode), 1500);
  };

  const selected = MODES.find((m) => m.id === selecting);

  return (
    <motion.div
      className="ms-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BioluminescentField />

      {/* Title */}
      <header className="ms-title">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Welcome 
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Pick how you want to look around
        </motion.p>
      </header>

      {/* Mode portals */}
      <motion.div className="ms-cards">
        {MODES.map((m, i) => {
          const isChosen = selecting === m.id;
          // While selecting: the chosen card scales up and fades as we "dive
          // into" it; the others gently drop away. Otherwise normal idle state.
          const exitAnim = selecting
            ? isChosen
              ? { opacity: 0, scale: 1.6, filter: 'blur(8px)' }
              : { opacity: 0, y: 30, scale: 0.92 }
            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' };
          return (
          <motion.button
            key={m.id}
            className={`ms-card ${hovered === i ? 'is-hot' : ''}`}
            style={{ '--mode-color': m.color }}
            onMouseEnter={() => !selecting && setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => !selecting && setHovered(i)}
            onBlur={() => setHovered(null)}
            onClick={() => handleSelect(m.id)}
            initial={{ opacity: 0, y: 40 }}
            animate={selecting ? exitAnim : { opacity: 1, y: 0 }}
            transition={
              selecting
                ? { duration: isChosen ? 0.7 : 0.4, ease: [0.22, 1, 0.36, 1] }
                : { delay: 0.7 + i * 0.15, duration: 0.6, ease: 'backOut' }
            }
            whileHover={selecting ? undefined : { y: -10 }}
            whileTap={selecting ? undefined : { scale: 0.97 }}
          >
            <span className="ms-card-index">0{i + 1}</span>

            <div className="ms-portal-holder">
              <ModePortal variant={m.id} color={m.color} hot={hovered === i} />
            </div>

            <span className="ms-card-name">{m.label}</span>
            <span className="ms-card-sub">{m.sub}</span>
            <span className="ms-card-enter">Enter</span>
          </motion.button>
          );
        })}
      </motion.div>

      {/* Glide-through-portal transition */}
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
            <PortalWarp color={selected?.color || '#7c6cff'} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
