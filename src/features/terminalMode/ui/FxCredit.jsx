import React, { useSyncExternalStore } from 'react';
import { subscribe, getState, currentEffect } from '../lib/fxStore';

/*
 * FxCredit — a subtle "made with easy-3dkit" credit that lives ON the backdrop.
 *
 * Rendered at a low z-index so the terminal window sits in front of it: it shows
 * through in the desktop margins around the window and fully when the window is
 * closed. Names the live effect so the credit doubles as a "now playing" label,
 * and links to the easy-3dkit docs.
 */

const FxCredit = () => {
    const state = useSyncExternalStore(subscribe, getState, getState);
    const effect = currentEffect(state);

    return (
        <a
            href="https://3d-kit.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="made with easy-3dkit — open the docs"
            style={{
                position: 'absolute', left: 18, bottom: 16, zIndex: 1,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem',
                color: 'rgba(201,209,217,0.55)', textDecoration: 'none',
                textShadow: '0 1px 8px rgba(0,0,0,0.7)', userSelect: 'none',
            }}
        >
            <span style={{ color: 'rgba(57,211,83,0.8)' }}>◆</span>
            made with easy-3dkit
            <span style={{ color: 'rgba(86,212,221,0.7)' }}>· {effect.name}</span>
        </a>
    );
};

export default FxCredit;
