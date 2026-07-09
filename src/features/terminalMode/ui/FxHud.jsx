import React, { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    EFFECT_COUNT, subscribe, getState,
    currentEffect, effectParams, fxNext, fxPrev, fxShuffle, fxToggleAuto,
    fxSetParam, fxResetCurrent, fxShowHud,
} from '../lib/fxStore';
import { IconPrev, IconNext, IconShuffle, IconPlay, IconPause, IconChevron } from './fxIcons';

/*
 * FxHud — a small, draggable "mini-player" window for the easy-3dkit backdrop.
 *
 * Compact by design: a drag-handle title bar (effect name + n/N), a row of
 * media-player-style icon buttons (prev / shuffle / auto / next), and the live
 * settings sliders tucked into a collapsible drawer so the window stays small.
 * Floats freely on the terminal desktop (dragged by its title bar) and is fully
 * responsive. Everything writes to fxStore, keeping the backdrop and the `fx`
 * command in sync.
 */

const C = {
    bg: 'rgba(13,17,23,0.94)', chrome: '#161b22', border: '#21262d',
    text: '#c9d1d9', dim: '#8b949e', dimmer: '#6e7681',
    accent: '#39d353', accent2: '#56d4dd',
};
const DOCS_URL = 'https://3d-kit.netlify.app';

const IconBtn = ({ title, onClick, active, children }) => (
    <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title={title}
        aria-label={title}
        aria-pressed={active}
        style={{
            width: 30, height: 30, flex: '1 1 0', borderRadius: 7, cursor: 'pointer',
            background: active ? 'rgba(57,211,83,0.16)' : C.chrome,
            border: `1px solid ${active ? C.accent : C.border}`,
            color: active ? C.accent : C.accent2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            transition: 'border-color .15s, color .15s',
        }}
        onMouseOver={(e) => { if (!active) e.currentTarget.style.borderColor = C.accent2; }}
        onMouseOut={(e) => { if (!active) e.currentTarget.style.borderColor = C.border; }}
    >{children}</button>
);

/* ─── live setting controls ───────────────────────────────────────────── */
const RangeControl = ({ ctrl, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 66, flexShrink: 0, color: C.dim, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctrl.key}</span>
        <input
            type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={value}
            aria-label={ctrl.key}
            onChange={(e) => fxSetParam(ctrl.key, parseFloat(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ flex: 1, minWidth: 0, accentColor: C.accent, height: 3, cursor: 'pointer' }}
        />
        <span style={{ width: 38, flexShrink: 0, textAlign: 'right', color: C.text, fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}>
            {Number.isInteger(value) ? value : value.toFixed(ctrl.step < 0.01 ? 4 : 2)}
        </span>
    </div>
);

const ColorControl = ({ ctrl, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 66, flexShrink: 0, color: C.dim, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctrl.key}</span>
        <label style={{ position: 'relative', width: 16, height: 16, flexShrink: 0, borderRadius: 4, background: value, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <input
                type="color" value={value} aria-label={ctrl.key}
                onChange={(e) => fxSetParam(ctrl.key, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
        </label>
        <span style={{ flex: 1, minWidth: 0, color: C.text, fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
);

const FxHud = ({ boundsRef }) => {
    const state = useSyncExternalStore(subscribe, getState, getState);
    const effect = currentEffect(state);
    const params = effectParams(state);
    const [open, setOpen] = useState(false); // settings drawer
    const dragControls = useDragControls();

    return (
        <AnimatePresence>
            {state.hud && (
                <motion.div
                    key="fx-hud"
                    drag
                    dragListener={false}
                    dragControls={dragControls}
                    dragMomentum={false}
                    dragElastic={0.04}
                    dragConstraints={boundsRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute', top: 70, right: 24, zIndex: 250,
                        width: 'min(232px, calc(100vw - 24px))',
                        background: C.bg, backdropFilter: 'blur(16px)',
                        border: `1px solid ${C.border}`, borderRadius: 12,
                        boxShadow: '0 14px 44px rgba(0,0,0,0.6)',
                        fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden',
                    }}
                >
                    {/* Title bar = drag handle */}
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '7px 8px 7px 10px', background: C.chrome,
                            borderBottom: `1px solid ${C.border}`,
                            cursor: 'grab', touchAction: 'none', userSelect: 'none',
                        }}
                    >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, flexShrink: 0, boxShadow: `0 0 6px ${C.accent}` }} />
                        <span style={{ color: C.text, fontSize: '0.74rem', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{effect.name}</span>
                        <span style={{ color: C.dimmer, fontSize: '0.62rem', flexShrink: 0 }}>{state.index + 1}/{EFFECT_COUNT}</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
                            aria-label={open ? 'Hide settings' : 'Show settings'}
                            aria-expanded={open}
                            style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex' }}
                        ><IconChevron open={open} /></button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fxShowHud(false); }}
                            aria-label="Close panel"
                            style={{ background: 'none', border: 'none', color: C.dimmer, cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px', lineHeight: 1 }}
                        >✕</button>
                    </div>

                    {/* Media-player transport */}
                    <div style={{ display: 'flex', gap: 6, padding: 8 }}>
                        <IconBtn title="Previous effect" onClick={fxPrev}><IconPrev /></IconBtn>
                        <IconBtn title="Shuffle" onClick={fxShuffle}><IconShuffle /></IconBtn>
                        <IconBtn title={state.auto ? 'Stop auto-shuffle' : 'Auto-shuffle'} onClick={fxToggleAuto} active={state.auto}>
                            {state.auto ? <IconPause /> : <IconPlay />}
                        </IconBtn>
                        <IconBtn title="Next effect" onClick={fxNext}><IconNext /></IconBtn>
                    </div>

                    {/* Collapsible settings drawer */}
                    <AnimatePresence initial={false}>
                        {open && (
                            <motion.div
                                key="drawer"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden', borderTop: `1px solid ${C.border}` }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 10px 8px' }}>
                                    {effect.controls.map((ctrl) => (
                                        ctrl.type === 'color'
                                            ? <ColorControl key={ctrl.key} ctrl={ctrl} value={params[ctrl.key]} />
                                            : <RangeControl key={ctrl.key} ctrl={ctrl} value={params[ctrl.key]} />
                                    ))}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                                        <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                            style={{ color: C.accent, fontSize: '0.6rem', textDecoration: 'none' }}>◆ easy-3dkit</a>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); fxResetCurrent(); }}
                                            style={{ background: 'none', border: 'none', color: C.accent2, cursor: 'pointer', fontSize: '0.62rem', padding: 0 }}>reset</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FxHud;
