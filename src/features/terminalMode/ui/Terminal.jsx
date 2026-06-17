import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCommand, complete } from '../lib/CommandParser';
import { getWelcomeView, CONTACT_ACTION } from '../lib/TerminalViews';
import ContactModal from '../../../shared/ui/ContactModal';

// Lazy-loaded so the Three.js/R3F backdrop only ships when Work mode mounts.
const StarryNight = lazy(() => import('./StarryNight'));

/* ─── Modern muted palette (Warp / Tokyo-Night inspired) ─────────────── */
const C = {
    bg:       '#0d1117', // window body
    bgChrome: '#161b22', // title / status bars
    border:   '#21262d',
    text:     '#c9d1d9', // default output
    dim:      '#6e7681', // descriptions, separators
    dimmer:   '#484f58', // ghost text, faint chrome
    accent:   '#39d353', // primary green (commands, prompt)
    accent2:  '#56d4dd', // teal (headers, keys, view)
    accent3:  '#d2a8ff', // mauve (links / numbers)
    warn:     '#e3b341',
    error:    '#f85149',
    promptUser:'#56d4dd',
    promptHost:'#39d353',
    promptPath:'#6e7681',
};

/* ─── Syntax-highlight a line of terminal output ─────────────────────── */
const HighlightedLine = ({ text }) => {
    if (!text) return null;

    // Section headers (e.g. "[1] ABOUT ME")
    if (/^\[[\d]\]/.test(text.trim())) {
        return <span style={{ color: C.accent2, fontWeight: 700, letterSpacing: '0.04em' }}>{text}</span>;
    }
    // Separator lines
    if (/^[━─═]+$/.test(text.trim())) {
        return <span style={{ color: C.border }}>{text}</span>;
    }
    // Bullet points
    if (text.trim().startsWith('•') || text.trim().startsWith('*')) {
        const m = text.match(/^(\s*)([•*])(.*)/);
        return (
            <span>
                <span>{m[1]}</span>
                <span style={{ color: C.accent }}>{m[2]}</span>
                <span style={{ color: C.text }}>{m[3]}</span>
            </span>
        );
    }
    // Help group headers — a bare capitalized word at column 0 (e.g. "Navigation")
    if (/^(Navigation|Portfolio|System|Mode|NAME|SYNOPSIS|ALIASES)\b/.test(text)) {
        return <span style={{ color: C.accent3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.78rem' }}>{text}</span>;
    }
    // Help command rows — "  <cmd> [args]   description" (2-space indent, gap before desc)
    const helpRow = text.match(/^(  )([a-z][\w?<>[\]| .-]*?)(\s{2,})(.+)$/);
    if (helpRow) {
        return (
            <span>
                <span>{helpRow[1]}</span>
                <span style={{ color: C.accent, fontWeight: 600 }}>{helpRow[2]}</span>
                <span>{helpRow[3]}</span>
                <span style={{ color: C.dim }}>{helpRow[4]}</span>
            </span>
        );
    }
    // Keys like "Email:" "GitHub:"
    if (/^[A-Za-z ]+:/.test(text.trim())) {
        const match = text.match(/^([A-Za-z ]+:)(.*)/);
        if (match) return (
            <span>
                <span style={{ color: C.accent2, fontWeight: 600 }}>{match[1]}</span>
                <span style={{ color: C.text }}>{match[2]}</span>
            </span>
        );
    }
    // Menu items  "[1] About Me ..."
    if (/^\s+\[\d\]/.test(text)) {
        const match = text.match(/(\s+\[(\d)\]\s+)([A-Za-z ]+)(.*)/);
        if (match) return (
            <span>
                <span style={{ color: C.dimmer }}>{match[1].match(/\s+/)[0]}</span>
                <span style={{ color: C.accent3, fontWeight: 700 }}>{match[2]}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>  {match[3]}</span>
                <span style={{ color: C.dim }}>{match[4]}</span>
            </span>
        );
    }
    // Default
    return <span style={{ color: C.text }}>{text}</span>;
};

/* ─── Clickable "open contact form" action line ──────────────────────── */
const ContactActionLine = ({ onOpen }) => (
    <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, margin: '2px 0',
            padding: '6px 14px', cursor: 'pointer',
            background: 'rgba(57,211,83,0.08)', border: `1px solid ${C.accent}`,
            borderRadius: 7, color: C.accent,
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', fontWeight: 600,
            transition: 'background .15s ease, color .15s ease',
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = C.bg; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(57,211,83,0.08)'; e.currentTarget.style.color = C.accent; }}
    >
        <span>❯</span> open contact form
    </button>
);

/* ─── Render a full pre-formatted output block ───────────────────────── */
const OutputBlock = ({ content, onOpenContact }) => {
    if (!content) return null;
    const lines = content.split('\n');
    return (
        <div style={{ lineHeight: '1.6', fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: '0.875rem' }}>
            {lines.map((line, i) =>
                line.trim() === CONTACT_ACTION ? (
                    <div key={i}><ContactActionLine onOpen={onOpenContact} /></div>
                ) : (
                    <div key={i}><HighlightedLine text={line} /></div>
                )
            )}
        </div>
    );
};

/* ─── Title bar (macOS traffic lights + centered tab) ────────────────── */
const TitleBar = ({ currentView, onClose, onMinimize, onMaximize, maximized }) => {
    const dot = (color, onClick, title) => (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} style={{
            width: 12, height: 12, borderRadius: '50%', background: color,
            border: 'none', cursor: 'pointer', padding: 0, transition: 'filter .15s',
        }}
            onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.25)')}
            onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
        />
    );
    return (
        <div
            onDoubleClick={onMaximize}
            style={{
                display: 'flex', alignItems: 'center', padding: '11px 16px',
                background: C.bgChrome, borderBottom: `1px solid ${C.border}`,
                userSelect: 'none', flexShrink: 0, gap: 14,
            }}
        >
            <div style={{ display: 'flex', gap: 9 }}>
                {dot('#ff5f57', onClose, 'Close window')}
                {dot('#febc2e', onMinimize, 'Minimize to dock')}
                {dot('#28c840', onMaximize, maximized ? 'Restore' : 'Maximize')}
            </div>

            {/* Active tab pill */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '4px 14px', borderRadius: 7,
                    background: C.bg, border: `1px solid ${C.border}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem', color: C.dim,
                }}>
                    <span style={{ color: C.accent }}>❯_</span>
                    <span style={{ color: C.text }}>
                        agrim@portfolio
                    </span>
                    <span style={{ color: C.dimmer }}>
                        {currentView === 'welcome' ? '~' : `~/${currentView}`}
                    </span>
                </div>
            </div>

            <div style={{ width: 60 }} />
        </div>
    );
};

/* ─── Status bar (Starship-style segments) ───────────────────────────── */
const StatusBar = ({ currentView, commandCount }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const seg = (children, color) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color }}>{children}</span>
    );

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 16px', background: C.bgChrome, borderTop: `1px solid ${C.border}`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.dim,
            flexShrink: 0, userSelect: 'none',
        }}>
            {seg(<>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
                work mode
            </>, C.dim)}
            {seg(<>view <span style={{ color: C.accent2 }}>{currentView}</span></>)}
            {seg(<>⌘ <span style={{ color: C.text }}>{commandCount}</span> cmds</>)}
            {seg(<span style={{ color: C.dim }}>
                {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </span>)}
        </div>
    );
};

/* ─── Terminal app icon (used in the dock) ───────────────────────────── */
const TerminalIcon = ({ size = 40 }) => (
    <div style={{
        width: size, height: size, borderRadius: size * 0.23,
        background: 'linear-gradient(145deg, #1c2330, #0d1117)',
        border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
        <span style={{ color: C.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: size * 0.4, fontWeight: 700, letterSpacing: '-1px' }}>
            ❯_
        </span>
    </div>
);

/* ─── macOS-style dock ───────────────────────────────────────────────── */
const Dock = ({ items }) => (
    <motion.div
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 90, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
            position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
            display: 'flex', alignItems: 'flex-end', gap: 14,
            padding: '10px 16px', borderRadius: 20,
            background: 'rgba(22,27,34,0.72)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}
    >
        {items.map(({ key, title, onClick, badge, render }) => (
            <motion.button
                key={key}
                onClick={onClick}
                title={title}
                whileHover={{ y: -10, scale: 1.18 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                style={{
                    position: 'relative', background: 'none', border: 'none',
                    padding: 0, cursor: 'pointer', transformOrigin: 'bottom center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
            >
                {render || <TerminalIcon />}
                {badge && (
                    <span style={{
                        position: 'absolute', top: -3, right: -3, width: 8, height: 8,
                        borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}`,
                        border: '1px solid #0d1117',
                    }} />
                )}
                {/* running indicator dot */}
                <span style={{
                    width: 4, height: 4, borderRadius: '50%', marginTop: 4,
                    background: C.dim,
                }} />
            </motion.button>
        ))}
    </motion.div>
);

/* ─── Main Terminal Component ────────────────────────────────────────── */
const Terminal = ({ onSwitchToFun, onSwitchToNormal, onResetMode }) => {
    const [outputLines, setOutputLines] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentView, setCurrentView] = useState('welcome');
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    const [windowState, setWindowState] = useState('open'); // 'open' | 'minimized' | 'closed'
    const [maximized, setMaximized] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    // Re-launch a closed terminal from a fresh session.
    const relaunch = () => {
        setOutputLines([{ type: 'output', content: getWelcomeView() }]);
        setCommandHistory([]);
        setNavigationHistory([]);
        setCurrentView('welcome');
        setInputValue('');
        setWindowState('open');
    };

    useEffect(() => {
        setOutputLines([{ type: 'output', content: getWelcomeView() }]);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [outputLines]);

    useEffect(() => {
        if (!showMenu && windowState === 'open') inputRef.current?.focus();
    }, [showMenu, windowState]);

    // Esc restores a maximized window.
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && maximized) setMaximized(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [maximized]);

    const handleTerminalClick = () => {
        if (!showMenu && windowState === 'open') inputRef.current?.focus();
    };

    const handleSubmit = (e, manualValue) => {
        if (e) e.preventDefault();
        const activeCommand = (manualValue !== undefined ? manualValue : inputValue).trim();
        if (!activeCommand) return;

        const newOutputLines = [...outputLines, { type: 'command', content: activeCommand }];
        const result = parseCommand(activeCommand, currentView, navigationHistory, commandHistory);

        if (result.clearScreen) {
            setOutputLines([]);
            setInputValue('');
            setCurrentView('welcome');
            setNavigationHistory([]);
            return;
        }
        if (result.resetMode && onResetMode) { onResetMode(); return; }
        if (result.switchToFun && onSwitchToFun) { onSwitchToFun(); return; }
        if (result.switchToNormal && onSwitchToNormal) { onSwitchToNormal(); return; }
        if (result.toggleFullscreen) {
            setMaximized((m) => !m);
        }
        if (result.output) {
            newOutputLines.push({ type: result.error ? 'error' : 'output', content: result.output });
        }

        setOutputLines(newOutputLines);

        if (result.view !== currentView && !result.isBack && !result.error) {
            setNavigationHistory([...navigationHistory, currentView]);
        } else if (result.isBack && navigationHistory.length > 0) {
            setNavigationHistory(navigationHistory.slice(0, -1));
        }
        if (result.view) setCurrentView(result.view);

        setCommandHistory([...commandHistory, activeCommand]);
        setHistoryIndex(-1);
        setInputValue('');
    };

    // Context-aware completion (commands AND file/section args) — powers Tab + ghost text.
    const { completed } = inputValue.length > 0 && !/\s$/.test(inputValue)
        ? complete(inputValue)
        : { completed: null };
    // Ghost text: only when the completion strictly extends what's typed.
    const ghostSuffix =
        completed && completed.toLowerCase().startsWith(inputValue.toLowerCase()) && completed.length > inputValue.length
            ? completed.slice(inputValue.length)
            : '';

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const { completed: c, matches: m } = complete(inputValue);
            if (c && c !== inputValue) {
                setInputValue(c);
                setHistoryIndex(-1);
            } else if (m.length > 1) {
                // Ambiguous — list candidates like a real shell.
                setOutputLines((prev) => [
                    ...prev,
                    { type: 'command', content: inputValue },
                    { type: 'output', content: `\n${m.join('    ')}\n` },
                ]);
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            setOutputLines([]);
            setCurrentView('welcome');
            setNavigationHistory([]);
            return;
        }
        if (e.key === 'ArrowRight' && ghostSuffix && inputRef.current?.selectionStart === inputValue.length) {
            e.preventDefault();
            setInputValue(inputValue + ghostSuffix);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const idx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(idx);
                setInputValue(commandHistory[idx]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const idx = historyIndex + 1;
                if (idx >= commandHistory.length) { setHistoryIndex(-1); setInputValue(''); }
                else { setHistoryIndex(idx); setInputValue(commandHistory[idx]); }
            }
        }
    };

    const MENU_ITEMS = [
        { label: 'about',     hint: '1', cmd: 'about',      accent: C.accent },
        { label: 'research',  hint: '2', cmd: 'research',   accent: C.accent },
        { label: 'projects',  hint: '3', cmd: 'projects',   accent: C.accent },
        { label: 'experience',hint: '4', cmd: 'experience', accent: C.accent },
        { label: 'skills',    hint: '5', cmd: 'skills',     accent: C.accent },
        { label: 'contact',   hint: '6', cmd: 'contact',    accent: C.accent },
        { label: 'ls',        hint: '↳', cmd: 'ls',         accent: C.accent2 },
        { label: 'tree',      hint: '↳', cmd: 'tree',       accent: C.accent2 },
        { label: 'help',      hint: '?', cmd: 'help',       accent: C.accent2 },
        { label: 'neofetch',  hint: '◆', cmd: 'neofetch',   accent: C.accent2 },
        { label: 'clear',     hint: '⌫', cmd: 'clear',      accent: C.warn },
        { label: 'fun mode',  hint: '★', cmd: 'fun',        accent: C.accent3 },
    ];

    // Prompt segments shared by past commands and the live input.
    const Prompt = () => (
        <span style={{ flexShrink: 0, fontSize: '0.875rem', whiteSpace: 'pre' }}>
            <span style={{ color: C.promptUser }}>agrim</span>
            <span style={{ color: C.dimmer }}> on </span>
            <span style={{ color: C.promptHost }}>portfolio</span>
            <span style={{ color: C.accent, fontWeight: 700 }}> ❯ </span>
        </span>
    );

    return (
        <div
            onClick={handleTerminalClick}
            style={{
                width: '100vw', minHeight: '100vh', height: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: maximized ? 0 : 'min(4vh, 36px) min(4vw, 48px)', boxSizing: 'border-box',
                background: 'radial-gradient(ellipse at 30% 20%, #131a26 0%, #0a0d12 60%, #06080b 100%)',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace", position: 'relative', overflow: 'hidden',
                transition: 'padding 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
                .term-scroll::-webkit-scrollbar { width: 8px; }
                .term-scroll::-webkit-scrollbar-track { background: transparent; }
                .term-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
                .term-scroll::-webkit-scrollbar-thumb:hover { background: ${C.dimmer}; }
            `}</style>

            {/* Live kinetic starfield backdrop (lazy / WebGL) */}
            <Suspense fallback={null}>
                <StarryNight />
            </Suspense>

            {/* Soft ambient glow behind the window */}
            <div style={{
                position: 'absolute', width: 600, height: 400, borderRadius: '50%',
                background: `radial-gradient(circle, ${C.accent}14, transparent 70%)`,
                filter: 'blur(40px)', pointerEvents: 'none', zIndex: 1,
            }} />

            {/* ─── Floating terminal window ─── */}
            <AnimatePresence>
              {windowState === 'open' && (
              <motion.div
                key="term-window"
                custom={windowState}
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{
                    opacity: 1, y: 0, scale: 1,
                    maxWidth: maximized ? '100vw' : 1080,
                    maxHeight: maximized ? '100vh' : 760,
                    borderRadius: maximized ? 0 : 14,
                }}
                exit="exit"
                variants={{
                    // Genie into the dock when minimizing; shrink-and-fade when closing.
                    exit: (cause) => cause === 'minimized'
                        ? { opacity: 0, scale: 0.04, y: 420, originX: 0.5, originY: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
                        : { opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.22, ease: 'easeIn' } },
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: '100%', height: '100%', zIndex: 2,
                    display: 'flex', flexDirection: 'column', position: 'relative',
                    background: C.bg, overflow: 'hidden',
                    border: `1px solid ${C.border}`,
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
                }}
              >
                <TitleBar
                    currentView={currentView}
                    maximized={maximized}
                    onClose={() => { setShowMenu(false); setMaximized(false); setWindowState('closed'); }}
                    onMinimize={() => { setShowMenu(false); setWindowState('minimized'); }}
                    onMaximize={() => setMaximized((m) => !m)}
                />

                {/* Scrollable output */}
                <div
                    ref={scrollRef}
                    className="term-scroll"
                    style={{
                        flex: 1, overflowY: 'auto', padding: '22px 26px',
                        paddingBottom: showMenu ? '300px' : '22px',
                        boxSizing: 'border-box', position: 'relative',
                    }}
                >
                    {outputLines.map((line, i) => (
                        <div key={i} style={{ marginBottom: line.type === 'command' ? 4 : 10 }}>
                            {line.type === 'command' ? (
                                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                    <Prompt />
                                    <span style={{ color: C.text, fontSize: '0.875rem' }}>{line.content}</span>
                                </div>
                            ) : (
                                <div style={{ paddingLeft: 2, color: line.type === 'error' ? C.error : undefined }}>
                                    {line.type === 'error'
                                        ? <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.875rem', color: C.error, whiteSpace: 'pre-wrap' }}>{line.content}</pre>
                                        : <OutputBlock content={line.content} onOpenContact={() => setContactOpen(true)} />}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Live input row */}
                    <form
                        onSubmit={(e) => handleSubmit(e, inputValue)}
                        style={{ display: 'flex', alignItems: 'baseline', marginTop: 6 }}
                    >
                        <Prompt />
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: C.text, fontSize: '0.875rem', whiteSpace: 'pre' }}>{inputValue}</span>
                            <span style={{
                                display: 'inline-block', width: '8px', height: '1.05em',
                                background: C.accent, marginLeft: 1, borderRadius: 1,
                                animation: 'blink 1.1s step-end infinite',
                            }} />
                            {ghostSuffix && (
                                <span style={{ color: C.dimmer, fontSize: '0.875rem', whiteSpace: 'pre' }}>
                                    {ghostSuffix}
                                </span>
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                                spellCheck="false"
                                style={{
                                    position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'text', fontSize: '0.875rem',
                                }}
                            />
                        </div>
                        {/* Inline accept-hint when there's a ghost suggestion */}
                        {ghostSuffix && (
                            <span style={{ color: C.dimmer, fontSize: '0.68rem', flexShrink: 0, paddingLeft: 10 }}>
                                tab ↹
                            </span>
                        )}
                    </form>
                </div>

                <StatusBar currentView={currentView} commandCount={commandHistory.length} />

                {/* Floating menu toggle */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    title="Command palette"
                    style={{
                        position: 'absolute', bottom: 54, right: 22, zIndex: 200,
                        width: 46, height: 46, borderRadius: 12,
                        background: showMenu ? C.bgChrome : C.bgChrome,
                        border: `1px solid ${showMenu ? C.error : C.border}`,
                        color: showMenu ? C.error : C.accent,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)', transition: 'border-color .2s, color .2s',
                    }}
                >
                    {showMenu
                        ? <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>✕</span>
                        : <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-1px' }}>❯_</span>}
                </motion.button>

                {/* Command palette overlay */}
                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 190,
                                background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(16px)',
                                borderTop: `1px solid ${C.border}`, padding: '18px 22px 24px',
                            }}
                        >
                            <div style={{
                                fontSize: '0.68rem', color: C.dim, marginBottom: 14,
                                textTransform: 'uppercase', letterSpacing: '0.14em',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{ color: C.accent }}>❯</span> command palette
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                                {MENU_ITEMS.map(({ label, hint, cmd, accent }) => (
                                    <button
                                        key={cmd}
                                        onClick={() => { handleSubmit(null, cmd); setShowMenu(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                                            background: C.bg, border: `1px solid ${C.border}`,
                                            borderRadius: 8, color: C.text,
                                            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem',
                                            fontWeight: 500, transition: 'all 0.14s ease',
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = C.bgChrome; }}
                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}
                                    >
                                        <span style={{
                                            width: 20, height: 20, flexShrink: 0, borderRadius: 5,
                                            background: `${accent}1a`, color: accent,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.72rem', fontWeight: 700,
                                        }}>{hint}</span>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
              )}
            </AnimatePresence>

            {/* Empty-desktop hint when the window is closed */}
            <AnimatePresence>
                {windowState === 'closed' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.15 }}
                        style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            textAlign: 'center', color: C.dimmer,
                            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', userSelect: 'none',
                        }}
                    >
                        <div style={{ fontSize: '0.9rem', color: C.dim, marginBottom: 6 }}>No windows open</div>
                        Click the <span style={{ color: C.accent }}>❯_</span> icon in the dock to relaunch the terminal.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── macOS dock (shown when minimized or closed) ─── */}
            <AnimatePresence>
                {windowState !== 'open' && (
                    <Dock items={[
                        {
                            key: 'terminal',
                            title: windowState === 'minimized' ? 'Terminal (minimized) — click to restore' : 'Terminal — click to launch',
                            badge: windowState === 'minimized',
                            onClick: () => (windowState === 'minimized' ? setWindowState('open') : relaunch()),
                        },
                        {
                            key: 'modes',
                            title: 'Back to mode selection',
                            onClick: onResetMode,
                            render: (
                                <div style={{
                                    width: 40, height: 40, borderRadius: 9,
                                    background: 'linear-gradient(145deg, #1c2330, #0d1117)',
                                    border: `1px solid ${C.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
                                    color: C.accent2, fontSize: '1.1rem',
                                }}>⊞</div>
                            ),
                        },
                    ]} />
                )}
            </AnimatePresence>

            {/* Shared contact modal — terminal-themed. */}
            <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} variant="terminal" />
        </div>
    );
};

export default Terminal;
