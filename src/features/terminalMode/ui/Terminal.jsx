import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCommand } from '../lib/CommandParser';
import { getWelcomeView } from '../lib/TerminalViews';

/* ─── Syntax-highlight a line of terminal output ─────────────────────── */
const HighlightedLine = ({ text }) => {
    if (!text) return null;

    // Section headers (e.g. "[1] ABOUT ME")
    if (/^\[[\d]\]/.test(text.trim())) {
        return <span style={{ color: '#00ffd5', fontWeight: 'bold', textShadow: '0 0 12px #00ffd5' }}>{text}</span>;
    }
    // Separator lines
    if (/^[━─═]+$/.test(text.trim())) {
        return <span style={{ color: '#1a4d2e', opacity: 0.8 }}>{text}</span>;
    }
    // Bullet points
    if (text.trim().startsWith('•') || text.trim().startsWith('*')) {
        return <span style={{ color: '#7fff7f' }}>{text}</span>;
    }
    // Keys like "Email:" "GitHub:"
    if (/^[A-Za-z ]+:/.test(text.trim())) {
        const match = text.match(/^([A-Za-z ]+:)(.*)/);
        if (match) return (
            <span>
                <span style={{ color: '#00ffd5', fontWeight: 'bold' }}>{match[1]}</span>
                <span style={{ color: '#a0ffb0' }}>{match[2]}</span>
            </span>
        );
    }
    // Menu items  "[1] About Me ..."
    if (/^\s+\[\d\]/.test(text)) {
        const match = text.match(/(\s+\[(\d)\]\s+)([A-Za-z ]+)(.*)/);
        if (match) return (
            <span>
                <span style={{ color: '#555' }}>{match[1].match(/\s+/)[0]}</span>
                <span style={{ color: '#00ff41', fontWeight: 'bold' }}>[{match[2]}]</span>
                <span style={{ color: '#7fff7f' }}> {match[3]}</span>
                <span style={{ color: '#3a6e4a' }}>{match[4]}</span>
            </span>
        );
    }
    // Default
    return <span style={{ color: '#b0ffb0' }}>{text}</span>;
};

/* ─── Render a full pre-formatted output block ───────────────────────── */
const OutputBlock = ({ content }) => {
    if (!content) return null;
    const lines = content.split('\n');
    return (
        <div style={{ lineHeight: '1.55', fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: '0.9rem' }}>
            {lines.map((line, i) => (
                <div key={i}><HighlightedLine text={line} /></div>
            ))}
        </div>
    );
};

/* ─── macOS-style title bar ──────────────────────────────────────────── */
const TitleBar = ({ currentView, onClose, onMinimize, onFun }) => (
    <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 18px',
        background: 'rgba(10, 18, 10, 0.95)', borderBottom: '1px solid #0d2d0d',
        userSelect: 'none', flexShrink: 0, gap: 12
    }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} title="Close" style={{ width: 13, height: 13, borderRadius: '50%', background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0 }} />
            <button onClick={onMinimize} title="Normal Mode" style={{ width: 13, height: 13, borderRadius: '50%', background: '#febc2e', border: 'none', cursor: 'pointer', padding: 0 }} />
            <button onClick={onFun} title="Fun Mode" style={{ width: 13, height: 13, borderRadius: '50%', background: '#28c840', border: 'none', cursor: 'pointer', padding: 0 }} />
        </div>

        {/* Title */}
        <div style={{
            flex: 1, textAlign: 'center', color: '#3a6e4a',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', letterSpacing: '0.05em'
        }}>
            agrim@portfolio — {currentView === 'welcome' ? '~' : `~/${currentView}`} — zsh
        </div>

        {/* Right spacer to visually balance the traffic lights */}
        <div style={{ width: 55 }} />
    </div>
);

/* ─── Status bar ─────────────────────────────────────────────────────── */
const StatusBar = ({ currentView, commandCount }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 18px', background: 'rgba(0,20,5,0.97)', borderTop: '1px solid #0d2d0d',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#2a6040',
            flexShrink: 0, userSelect: 'none'
        }}>
            <span style={{ color: '#00ff41' }}>● WORK MODE</span>
            <span>VIEW: <span style={{ color: '#00ffd5' }}>{currentView.toUpperCase()}</span></span>
            <span>CMD: {commandCount}</span>
            <span style={{ color: '#00ff41' }}>
                {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
        </div>
    );
};

/* ─── Main Terminal Component ────────────────────────────────────────── */
const Terminal = ({ onSwitchToFun, onSwitchToNormal, onResetMode }) => {
    const [outputLines, setOutputLines] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentView, setCurrentView] = useState('welcome');
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [showMenu, setShowMenu] = useState(false);

    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        setOutputLines([{ type: 'output', content: getWelcomeView() }]);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [outputLines]);

    useEffect(() => {
        if (!showMenu) inputRef.current?.focus();
    }, [showMenu]);

    const handleTerminalClick = () => {
        if (!showMenu) inputRef.current?.focus();
    };

    const handleSubmit = (e, manualValue) => {
        if (e) e.preventDefault();
        const activeCommand = (manualValue !== undefined ? manualValue : inputValue).trim();
        if (!activeCommand) return;

        const newOutputLines = [...outputLines, { type: 'command', content: activeCommand }];
        const result = parseCommand(activeCommand, currentView, navigationHistory);

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
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
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

    const handleKeyDown = (e) => {
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
        { label: '① About',      cmd: 'about',      color: '#00ff41' },
        { label: '② Projects',   cmd: 'projects',   color: '#00ff41' },
        { label: '③ Experience', cmd: 'experience', color: '#00ff41' },
        { label: '④ Skills',     cmd: 'skills',     color: '#00ff41' },
        { label: '⑤ Contact',    cmd: 'contact',    color: '#00ff41' },
        { label: '☰  Menu',       cmd: 'menu',       color: '#7fff7f' },
        { label: '✕  Clear',      cmd: 'clear',      color: '#ff6666' },
        { label: '★  Fun Mode',   cmd: 'fun',        color: '#00ffd5' },
    ];

    return (
        <div style={{
            width: '100vw', height: '100vh', background: '#050e05',
            display: 'flex', flexDirection: 'column', position: 'relative',
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            overflow: 'hidden'
        }}>
            {/* Google Font Load */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
                @keyframes scanMove { 0%{top:-100px} 100%{top:100vh} }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #0d3d1a; border-radius: 2px; }
            `}</style>

            {/* CRT scan line sweep */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100px',
                background: 'linear-gradient(transparent, rgba(0,255,65,0.04), transparent)',
                animation: 'scanMove 6s linear infinite', zIndex: 99, pointerEvents: 'none'
            }} />
            {/* CRT scanlines grid */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 98, pointerEvents: 'none', opacity: 0.35,
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)',
                backgroundSize: '100% 3px'
            }} />
            {/* vignette */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 97, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.85) 100%)'
            }} />

            {/* Title bar */}
            <TitleBar
                currentView={currentView}
                onClose={onResetMode}
                onMinimize={onSwitchToNormal}
                onFun={onSwitchToFun}
            />

            {/* Scrollable output */}
            <div
                ref={scrollRef}
                onClick={handleTerminalClick}
                style={{
                    flex: 1, overflowY: 'auto', padding: '24px 30px',
                    paddingBottom: showMenu ? '310px' : '30px',
                    boxSizing: 'border-box', position: 'relative', zIndex: 1
                }}
            >
                {outputLines.map((line, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                        {line.type === 'command' ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ color: '#00ffd5', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                                    agrim
                                </span>
                                <span style={{ color: '#2a6040', fontSize: '0.85rem' }}>@</span>
                                <span style={{ color: '#00ff41', fontSize: '0.85rem', flexShrink: 0 }}>portfolio</span>
                                <span style={{ color: '#2a6040', fontSize: '0.85rem' }}>:~ $</span>
                                <span style={{ color: '#fff', fontSize: '0.9rem' }}>{line.content}</span>
                            </div>
                        ) : (
                            <div style={{ paddingLeft: 2 }}>
                                <OutputBlock content={line.content} />
                                {line.type === 'error' && (
                                    <span style={{ color: '#ff4444', fontWeight: 'bold' }}>
                                        {line.content}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Live input row */}
                <form
                    onSubmit={(e) => handleSubmit(e, inputValue)}
                    style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}
                >
                    <span style={{ color: '#00ffd5', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>agrim</span>
                    <span style={{ color: '#2a6040', fontSize: '0.85rem' }}>@</span>
                    <span style={{ color: '#00ff41', fontSize: '0.85rem', flexShrink: 0 }}>portfolio</span>
                    <span style={{ color: '#2a6040', fontSize: '0.85rem' }}>:~ $</span>

                    {/* Visual text + cursor */}
                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '0.9rem', whiteSpace: 'pre' }}>{inputValue}</span>
                        <span style={{
                            display: 'inline-block', width: '9px', height: '1em',
                            background: '#00ff41', marginLeft: 1,
                            animation: 'blink 1s step-end infinite',
                            boxShadow: '0 0 6px #00ff41'
                        }} />
                        {/* Invisible capture input */}
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
                                opacity: 0, cursor: 'text', fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </form>
            </div>

            {/* Status bar */}
            <StatusBar currentView={currentView} commandCount={commandHistory.length} />

            {/* Floating menu toggle */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                style={{
                    position: 'absolute', bottom: 52, right: 28, zIndex: 200,
                    width: 50, height: 50, borderRadius: '50%',
                    background: showMenu ? '#1a0505' : '#001a07',
                    border: `2px solid ${showMenu ? '#ff4444' : '#00ff41'}`,
                    color: showMenu ? '#ff4444' : '#00ff41',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: showMenu ? '0 0 16px rgba(255,68,68,0.4)' : '0 0 16px rgba(0,255,65,0.3)',
                    transition: 'all 0.2s ease'
                }}
            >
                {showMenu ? (
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✕</span>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                )}
            </motion.button>

            {/* Quick-nav menu overlay */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 190,
                            background: 'rgba(2, 8, 2, 0.97)', backdropFilter: 'blur(12px)',
                            borderTop: '1px solid #0d3d1a', padding: '22px 28px 28px',
                        }}
                    >
                        <div style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                            color: '#2a6040', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.12em'
                        }}>
                            NAVIGATE →
                        </div>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxWidth: 640
                        }}>
                            {MENU_ITEMS.map(({ label, cmd, color }) => (
                                <button
                                    key={cmd}
                                    onClick={() => { handleSubmit(null, cmd); setShowMenu(false); }}
                                    style={{
                                        padding: '11px 8px', cursor: 'pointer',
                                        background: 'rgba(0,255,65,0.05)',
                                        border: `1px solid ${color}33`,
                                        borderRadius: 6, color,
                                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem',
                                        fontWeight: 600, letterSpacing: '0.03em',
                                        transition: 'all 0.15s ease',
                                        textShadow: `0 0 8px ${color}66`
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = color; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,255,65,0.05)'; e.currentTarget.style.borderColor = `${color}33`; }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Terminal;
