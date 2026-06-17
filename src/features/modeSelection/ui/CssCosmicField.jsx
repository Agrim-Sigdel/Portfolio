import React, { useMemo } from 'react';

/*
 * CssCosmicField: the WebGL-free backdrop for the mode selector.
 *
 * Keeps the deep-space mood with zero three.js: a layered radial-gradient
 * "nebula" plus three parallax layers of stars drawn as box-shadow dots. Two
 * star layers drift in opposite directions and twinkle, so it still feels alive
 * but costs almost nothing.
 *
 * Star fields are generated once (seeded, no Math.random in render) into a
 * single text-shadow string per layer.
 */

// tiny seeded RNG so the starfield is stable across renders
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// build a box-shadow list of N stars spread over a WxH px field
function starField(seed, count, spread, color) {
  const rng = mulberry32(seed);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rng() * spread);
    const y = Math.floor(rng() * spread);
    parts.push(`${x}px ${y}px ${color}`);
  }
  return parts.join(', ');
}

export default function CssCosmicField() {
  const SPREAD = 2000;
  const far = useMemo(() => starField(1337, 700, SPREAD, 'rgba(255,255,255,0.8)'), []);
  const mid = useMemo(() => starField(4242, 300, SPREAD, 'rgba(159,182,255,0.9)'), []);
  const near = useMemo(() => starField(606, 120, SPREAD, 'rgba(255,207,138,0.95)'), []);

  return (
    <div className="ms-css-field" aria-hidden="true">
      {/* nebula glow */}
      <div className="ms-css-nebula" />
      {/* three tiled, drifting star layers */}
      <div className="ms-css-stars ms-css-stars--far" style={{ boxShadow: far }} />
      <div className="ms-css-stars ms-css-stars--mid" style={{ boxShadow: mid }} />
      <div className="ms-css-stars ms-css-stars--near" style={{ boxShadow: near }} />
    </div>
  );
}
