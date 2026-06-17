import React from 'react';

/*
 * ChargeRing: a circular progress ring drawn around a mode portal while the
 * launch is "charging". `progress` runs 0..1; at 1 the launch fires.
 *
 * Pure SVG stroke-dashoffset — cheap, no animation library needed. The ring is
 * invisible at progress 0 so it only appears once the user starts charging.
 */

const SIZE = 120;
const STROKE = 4;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function ChargeRing({ progress, color }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <svg
      className="ms-charge-ring"
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ opacity: p > 0 ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* faint track */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        opacity={0.18}
      />
      {/* filling arc, starting from the top */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - p)}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{
          filter: `drop-shadow(0 0 6px ${color})`,
          transition: 'stroke-dashoffset 0.06s linear',
        }}
      />
    </svg>
  );
}
