import React from 'react';

/*
 * CssPortal: the WebGL-free stand-in for ModePortal.
 *
 * Each mode keeps a visually distinct glyph so the cards still read as three
 * different worlds, drawn entirely with CSS (no three.js):
 *   normal -> "orbits"  : concentric rings + core
 *   fun    -> "galaxy"  : conic spiral that rotates
 *   work   -> "grid"    : a wireframe globe (meridians) + scan ring
 *
 * `hot` (active/focused) spins faster and glows brighter via the CSS class.
 */

export default function CssPortal({ variant, color, hot, charge = 0 }) {
  return (
    <div
      className={`ms-cssportal ms-cssportal--${variant} ${hot ? 'is-hot' : ''} ${charge > 0 ? 'is-charging' : ''}`}
      // `--charge` (0..1) drives the charge-reactive transforms in CSS
      style={{ '--mode-color': color, '--charge': charge }}
      aria-hidden="true"
    >
      {variant === 'normal' && (
        <>
          {/* constellation: two dotted orbital rings + a faint node web + core */}
          <span className="ms-cssp-orb ms-cssp-orb--1" />
          <span className="ms-cssp-orb ms-cssp-orb--2" />
          <span className="ms-cssp-nodes" />
          <span className="ms-cssp-core" />
        </>
      )}
      {variant === 'fun' && (
        <>
          <span className="ms-cssp-spiral" />
          <span className="ms-cssp-core" />
        </>
      )}
      {variant === 'work' && (
        <>
          <span className="ms-cssp-globe" />
          <span className="ms-cssp-globe ms-cssp-globe--v" />
          <span className="ms-cssp-scan" />
          <span className="ms-cssp-core" />
        </>
      )}
    </div>
  );
}
