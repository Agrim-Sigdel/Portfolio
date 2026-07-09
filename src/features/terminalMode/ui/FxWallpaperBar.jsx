import React, { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CATALOG, EFFECT_COUNT, subscribe, getState, currentEffect,
    fxNext, fxPrev, fxShuffle, fxToggleAuto, fxGoto,
} from '../lib/fxStore';
import { runFxCommand } from '../lib/CommandParser';
import { IconPrev, IconNext, IconShuffle, IconPlay, IconPause, IconChevron } from './fxIcons';

/*
 * FxWallpaperBar — the easy-3dkit backdrop mini-player for mobile.
 *
 * The terminal shell is desktop-only, so on phones this compact window IS the
 * way to explore the backdrop. It mirrors the desktop mini-player (FxHud): a
 * title bar (effect name + n/N + chevron) over a row of media-player icon
 * buttons. The chevron expands a drawer with the command box and a tap-to-pick
 * grid of all effects. It NEVER closes — minimizing just collapses the drawer,
 * so the same window is always there. Everything writes to fxStore.
 */

const C = {
    bg: 'rgba(13,17,23,0.94)', chrome: '#161b22', tile: '#0d1117', border: '#21262d',
    text: '#c9d1d9', dim: '#8b949e', dimmer: '#6e7681',
    accent: '#39d353', accent2: '#56d4dd', accent3: '#d2a8ff',
};
const DOCS_URL = 'https://3d-kit.netlify.app';

const IconBtn = ({ title, onClick, active, accent = C.accent2, children }) => (
    <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title={title}
        aria-label={title}
        aria-pressed={active}
        style={{
            height: 40, flex: '1 1 0', borderRadius: 9, cursor: 'pointer',
            background: active ? `${accent}1f` : C.tile,
            border: `1px solid ${active ? accent : C.border}`,
            color: active ? accent : accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
    >{children}</button>
);

const Tile = ({ badge, label, onClick, active }) => (
    <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title={label}
        aria-label={label}
        aria-pressed={active}
        style={{
            display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
            padding: '10px 11px', cursor: 'pointer', textAlign: 'left',
            background: active ? `${C.accent}1f` : C.tile,
            border: `1px solid ${active ? C.accent : C.border}`,
            borderRadius: 8, color: C.text,
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', fontWeight: 500,
        }}
    >
        <span style={{
            width: 22, height: 22, flexShrink: 0, borderRadius: 5,
            background: `${C.accent}1a`, color: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700,
        }}>{badge}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
);

const FxWallpaperBar = ({ mobile = true }) => {
    const state = useSyncExternalStore(subscribe, getState, getState);
    const effect = currentEffect(state);
    const [open, setOpen] = useState(false); // drawer (command + effects)
    const [cmd, setCmd] = useState('');
    const [status, setStatus] = useState('');

    const submit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = cmd.trim();
        if (!input) return;
        const res = runFxCommand(input);
        setStatus((res.output || '').split('\n')[0]);
        setCmd('');
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'absolute', zIndex: 260,
                left: '50%', transform: 'translateX(-50%)',
                bottom: mobile ? 'calc(16px + env(safe-area-inset-bottom))' : 24,
                width: 'min(340px, calc(100vw - 24px))',
                maxHeight: 'calc(100vh - 120px)', boxSizing: 'border-box',
                background: C.bg, backdropFilter: 'blur(16px)',
                border: `1px solid ${C.border}`, borderRadius: 14,
                boxShadow: '0 14px 44px rgba(0,0,0,0.6)',
                fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Title bar (no close — it never disappears) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px 9px 12px', background: C.chrome, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, flexShrink: 0, boxShadow: `0 0 6px ${C.accent}` }} />
                <span style={{ color: C.text, fontSize: '0.78rem', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{effect.name}</span>
                <span style={{ color: C.dimmer, fontSize: '0.64rem', flexShrink: 0 }}>{state.index + 1}/{EFFECT_COUNT}</span>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
                    aria-label={open ? 'Minimize' : 'More controls'}
                    aria-expanded={open}
                    style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex' }}
                ><IconChevron open={open} /></button>
            </div>

            {/* Transport — always visible */}
            <div style={{ display: 'flex', gap: 8, padding: 10 }}>
                <IconBtn title="Previous effect" onClick={fxPrev}><IconPrev /></IconBtn>
                <IconBtn title="Shuffle" onClick={fxShuffle} accent={C.accent3}><IconShuffle /></IconBtn>
                <IconBtn title={state.auto ? 'Stop auto-shuffle' : 'Auto-shuffle'} onClick={fxToggleAuto} accent={C.accent} active={state.auto}>
                    {state.auto ? <IconPause /> : <IconPlay />}
                </IconBtn>
                <IconBtn title="Next effect" onClick={fxNext}><IconNext /></IconBtn>
            </div>

            {/* Drawer — command box + effect picker */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="drawer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden', borderTop: `1px solid ${C.border}` }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, maxHeight: '46vh', overflowY: 'auto' }}>
                            <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.tile, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 10px' }}>
                                <span style={{ color: C.accent, fontSize: '0.8rem', flexShrink: 0 }}>fx ❯</span>
                                <input
                                    value={cmd}
                                    onChange={(e) => setCmd(e.target.value)}
                                    placeholder="shuffle · set speed 2 · auto…"
                                    aria-label="easy-3dkit command"
                                    autoComplete="off" spellCheck="false"
                                    style={{ flex: 1, minWidth: 0, height: 42, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontFamily: 'inherit', fontSize: 16 }}
                                />
                            </form>
                            {status && <div style={{ color: C.dim, fontSize: '0.66rem', margin: '-2px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status}</div>}

                            <div style={{ fontSize: '0.62rem', color: C.dim, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '2px 2px 0' }}>All {EFFECT_COUNT} effects</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                                {CATALOG.map((e, i) => (
                                    <Tile key={e.id} badge={i + 1} label={e.name} onClick={() => fxGoto(i)} active={i === state.index} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
                                <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                    style={{ color: C.accent, fontSize: '0.64rem', textDecoration: 'none' }}>◆ made with easy-3dkit</a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FxWallpaperBar;
