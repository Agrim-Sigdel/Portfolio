import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCommand, complete } from '../lib/CommandParser';
import { getWelcomeView } from '../lib/TerminalViews';
import { CONTACT_ACTION, HOME, getNode } from '../lib/vfs';
import ContactModal from '../../../shared/ui/ContactModal';
import SEO from '../../../shared/ui/SEO';

// Lazy-loaded so the Three.js/R3F backdrop only ships when Work mode mounts.
const StarryNight = lazy(() => import('./StarryNight'));

/* ─── Modern muted palette (GitHub-dark inspired) ────────────────────── */
const C = {
    bg:       '#0d1117', // window body
    bgChrome: '#161b22', // title / status bars
    border:   '#21262d',
    text:     '#c9d1d9', // default output
    dim:      '#8b949e', // descriptions, separators
    dimmer:   '#6e7681', // faint chrome
    accent:   '#39d353', // primary green (commands, prompt)
    accent2:  '#56d4dd', // teal (headers, dirs, cwd)
    accent3:  '#d2a8ff', // mauve (numbers, group headers)
    warn:     '#e3b341',
    error:    '#f85149',
};

/* ─── Syntax-highlight a line of terminal output ─────────────────────── */
const HighlightedLine = ({ text }) => {
    if (!text) return null;

    // Markdown-ish headings from VFS files ("# Title" / "## Sub")
    const heading = text.match(/^(#{1,2}) (.*)$/);
    if (heading) {
        return (
            <span>
                <span style={{ color: C.dimmer }}>{heading[1]} </span>
                <span style={{ color: heading[1] === '#' ? C.accent2 : C.accent3, fontWeight: 700 }}>{heading[2]}</span>
            </span>
        );
    }
    // Welcome banner box borders
    const boxTop = text.match(/^(\s*╭─ )([\w@.-]+)( ─+╮\s*)$/);
    if (boxTop) {
        return (
            <span>
                <span style={{ color: C.border }}>{boxTop[1]}</span>
                <span style={{ color: C.accent }}>{boxTop[2]}</span>
                <span style={{ color: C.border }}>{boxTop[3]}</span>
            </span>
        );
    }
    if (/^\s*[╭╰][─╮╯\s]*$/.test(text)) {
        return <span style={{ color: C.border }}>{text}</span>;
    }
    const boxMid = text.match(/^(\s*│)(.*)(│\s*)$/);
    if (boxMid) {
        return (
            <span>
                <span style={{ color: C.border }}>{boxMid[1]}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{boxMid[2]}</span>
                <span style={{ color: C.border }}>{boxMid[3]}</span>
            </span>
        );
    }
    // Separator lines
    if (/^[━─═]+$/.test(text.trim())) {
        return <span style={{ color: C.border }}>{text}</span>;
    }
    // Guided-menu rows: "  [1]  About       cat ~/about.txt"
    const menuRow = text.match(/^( {2})\[(\d)\]( {2})(\S[\w ]*?)( {2,})(.+)$/);
    if (menuRow) {
        return (
            <span>
                <span style={{ color: C.dimmer }}>{menuRow[1]}[</span>
                <span style={{ color: C.accent3, fontWeight: 700 }}>{menuRow[2]}</span>
                <span style={{ color: C.dimmer }}>]</span>
                <span>{menuRow[3]}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{menuRow[4]}</span>
                <span>{menuRow[5]}</span>
                <span style={{ color: C.accent }}>{menuRow[6]}</span>
            </span>
        );
    }
    // Tree rows: "│   ├── catd.md" — dim the connectors, color directories
    const treeRow = text.match(/^([│\s]*[├└]─+ )(.+)$/);
    if (treeRow) {
        const isDir = treeRow[2].endsWith('/');
        return (
            <span>
                <span style={{ color: C.dimmer }}>{treeRow[1]}</span>
                <span style={{ color: isDir ? C.accent2 : C.text, fontWeight: isDir ? 600 : 400 }}>{treeRow[2]}</span>
            </span>
        );
    }
    // Help group headers + man page section headers
    if (/^(filesystem|terminal|site)$/.test(text) || /^(NAME|SYNOPSIS|DESCRIPTION|ALIASES)$/.test(text)) {
        return <span style={{ color: C.accent3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.78rem' }}>{text}</span>;
    }
    // Help command rows — "  <cmd> [args]   description"
    const helpRow = text.match(/^( {2})([a-z][\w?<>[\]| .~/-]*?)( {2,})(.+)$/);
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
    // ls rows — filename tokens; directories (trailing '/') get a distinct color
    if (text.includes('/') && /^[A-Za-z0-9._-]+\/?( +[A-Za-z0-9._-]+\/?)* *$/.test(text)) {
        return (
            <span>
                {text.split(/(\s+)/).map((tok, i) =>
                    tok.endsWith('/') && tok.trim()
                        ? <span key={i} style={{ color: C.accent2, fontWeight: 600 }}>{tok}</span>
                        : <span key={i} style={{ color: C.text }}>{tok}</span>
                )}
            </span>
        );
    }
    // Success checkmarks (sudo hire-me)
    if (text.trim().startsWith('✓')) {
        return <span style={{ color: C.accent }}>{text}</span>;
    }
    // Menu-echo lines ("→ cat ~/about.txt")
    if (text.startsWith('→ ')) {
        return (
            <span>
                <span style={{ color: C.dimmer }}>→ </span>
                <span style={{ color: C.accent }}>{text.slice(2)}</span>
            </span>
        );
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
    // Keys like "Email:" "Outcome:"
    if (/^[A-Za-z ]+:/.test(text.trim())) {
        const match = text.match(/^([A-Za-z ]+:)(.*)/);
        if (match) return (
            <span>
                <span style={{ color: C.accent2, fontWeight: 600 }}>{match[1]}</span>
                <span style={{ color: C.text }}>{match[2]}</span>
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

/* ─── Live completion suggestions (zsh/fish-style row) ───────────────── */
// The word fragment currently being completed (last token, after any '/').
const fragmentOf = (input) => {
    if (!input || /\s$/.test(input)) return '';
    const tok = input.split(/\s+/).filter(Boolean).pop() || '';
    const slash = tok.lastIndexOf('/');
    return slash >= 0 ? tok.slice(slash + 1) : tok;
};

const MAX_SUGGESTIONS = 8;

// role="status" so screen readers announce the candidates; rendered OUTSIDE
// the role="log" scroll container so it's never read as command output.
const SuggestionRow = ({ suggestions, fragment }) => (
    <div
        role="status"
        style={{
            flexShrink: 0,
            padding: suggestions.length ? '8px 24px' : 0,
            borderTop: suggestions.length ? `1px solid ${C.border}` : 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.8rem', lineHeight: 1.6, color: C.dim,
        }}
    >
        {suggestions.slice(0, MAX_SUGGESTIONS).map((s) => {
            const matched = fragment && s.toLowerCase().startsWith(fragment.toLowerCase());
            return (
                <span key={s} style={{ marginRight: 16, whiteSpace: 'pre' }}>
                    {matched ? (
                        <>
                            <span style={{ color: C.text, fontWeight: 600 }}>{s.slice(0, fragment.length)}</span>
                            <span>{s.slice(fragment.length)}</span>
                        </>
                    ) : s}
                </span>
            );
        })}
        {suggestions.length > MAX_SUGGESTIONS && (
            <span style={{ color: C.dimmer }}>+{suggestions.length - MAX_SUGGESTIONS} more</span>
        )}
    </div>
);

/* ─── Prompt: starship-style two segments — cwd + ❯ ──────────────────── */
const Prompt = ({ path = HOME }) => (
    <span style={{ flexShrink: 0, fontSize: '0.875rem', whiteSpace: 'pre' }}>
        <span style={{ color: C.accent2, fontWeight: 600 }}>{path}</span>
        <span style={{ color: C.accent, fontWeight: 700 }}> ❯ </span>
    </span>
);

/* ─── Title bar (macOS traffic lights + centered tab) ────────────────── */
const TitleBar = ({ cwd, onClose, onMinimize, onMaximize, maximized }) => {
    const dot = (color, onClick, title) => (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} aria-label={title} style={{
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
                display: 'flex', alignItems: 'center', padding: '8px 16px',
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
                    padding: '3px 12px', borderRadius: 7,
                    background: C.bg, border: `1px solid ${C.border}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem', color: C.dim,
                }}>
                    <span style={{ color: C.accent }}>❯_</span>
                    <span style={{ color: C.text }}>
                        agrim@portfolio
                    </span>
                    <span style={{ color: C.dimmer }}>
                        {cwd}
                    </span>
                </div>
            </div>

            <div style={{ width: 60 }} />
        </div>
    );
};

/* ─── Status bar (static — no ticking clock) ─────────────────────────── */
const StatusBar = ({ cwd, itemCount }) => {
    const seg = (children, color) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color }}>{children}</span>
    );

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 16px', background: C.bgChrome, borderTop: `1px solid ${C.border}`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.dim,
            flexShrink: 0, userSelect: 'none', gap: 12,
        }}>
            {seg(<>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
                zsh · work mode
            </>, C.dim)}
            {seg(<span style={{ color: C.accent2 }}>{cwd}</span>)}
            {seg(<><span style={{ color: C.text }}>{itemCount}</span> items</>)}
            {seg(<span style={{ color: C.dimmer }}>type 'help' for commands</span>)}
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
                aria-label={title}
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

/* ─── Command palette entries (common commands) ──────────────────────── */
const MENU_ITEMS = [
    { label: 'ls',          hint: '❯', cmd: 'ls',                      accent: C.accent2 },
    { label: 'tree',        hint: '❯', cmd: 'tree',                    accent: C.accent2 },
    { label: 'about',       hint: '1', cmd: 'cat ~/about.txt',         accent: C.accent },
    { label: 'experience',  hint: '2', cmd: 'ls ~/experience',         accent: C.accent },
    { label: 'projects',    hint: '3', cmd: 'ls ~/projects',           accent: C.accent },
    { label: 'research',    hint: '4', cmd: 'cat ~/research/catd.md',  accent: C.accent },
    { label: 'skills',      hint: '5', cmd: 'cat ~/skills.txt',        accent: C.accent },
    { label: 'contact',     hint: '6', cmd: 'contact',                 accent: C.accent },
    { label: 'resume.pdf',  hint: '⇩', cmd: 'open ~/resume.pdf',       accent: C.accent3 },
    { label: 'menu',        hint: '☰', cmd: 'menu',                    accent: C.accent2 },
    { label: 'help',        hint: '?', cmd: 'help',                    accent: C.accent2 },
    { label: 'clear',       hint: '⌫', cmd: 'clear',                   accent: C.warn },
    { label: 'portfolio',   hint: '★', cmd: 'portfolio',               accent: C.accent3 },
];

/* ─── Main Terminal Component ────────────────────────────────────────── */
const Terminal = ({ onSwitchToFun, onSwitchToNormal, onResetMode }) => {
    const [outputLines, setOutputLines] = useState(() => [{ type: 'output', content: getWelcomeView() }]);
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [cwd, setCwd] = useState(HOME);
    const [menuActive, setMenuActive] = useState(false); // number keys work only while the menu is the last output
    const [suggestions, setSuggestions] = useState([]); // live tab-completion candidates ([] = row hidden)
    const [showMenu, setShowMenu] = useState(false);
    const [windowState, setWindowState] = useState('open'); // 'open' | 'minimized' | 'closed'
    const [maximized, setMaximized] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    // Touch devices navigate the terminal through the command palette, so we
    // never auto-focus the hidden input there — doing so would pop the on-screen
    // keyboard with nothing to type into. The contact form is a separate modal
    // that focuses its own fields, so the keyboard still opens when it's needed.
    const [isTouch] = useState(
        () => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: none)').matches,
    );

    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    const cwdNode = getNode(cwd);
    const itemCount = cwdNode && cwdNode.type === 'dir' ? Object.keys(cwdNode.children).length : 0;

    // Re-launch a closed terminal from a fresh session.
    const relaunch = () => {
        setOutputLines([{ type: 'output', content: getWelcomeView() }]);
        setCommandHistory([]);
        setCwd(HOME);
        setMenuActive(false);
        setSuggestions([]);
        setInputValue('');
        setWindowState('open');
    };

    // Font link stays in <head> after unmount — fonts are cached, removing it causes FOUT on re-entry.
    useEffect(() => {
        if (document.head.querySelector('link[data-jbmono]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.setAttribute('data-jbmono', '');
        link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap';
        document.head.appendChild(link);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [outputLines]);

    useEffect(() => {
        if (!isTouch && !showMenu && windowState === 'open') inputRef.current?.focus();
    }, [isTouch, showMenu, windowState]);

    // Esc restores a maximized window.
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && maximized) setMaximized(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [maximized]);

    const handleTerminalClick = () => {
        if (!isTouch && !showMenu && windowState === 'open') inputRef.current?.focus();
    };

    const handleSubmit = (e, manualValue) => {
        if (e) e.preventDefault();
        const activeCommand = (manualValue !== undefined ? manualValue : inputValue).trim();
        if (!activeCommand) return;

        const nextHistory = [...commandHistory, activeCommand];
        const result = parseCommand(activeCommand, { cwd, commandHistory: nextHistory, menuActive });

        setCommandHistory(nextHistory);
        setHistoryIndex(-1);
        setInputValue('');
        setSuggestions([]);
        setMenuActive(Boolean(result.isMenu));

        if (result.clearScreen) { setOutputLines([]); return; }
        if (result.resetMode && onResetMode) { onResetMode(); return; }
        if (result.switchToFun && onSwitchToFun) { onSwitchToFun(); return; }
        if (result.switchToNormal && onSwitchToNormal) { onSwitchToNormal(); return; }
        if (result.toggleFullscreen) setMaximized((m) => !m);
        if (result.openContact) setContactOpen(true);
        if (result.openUrl) window.open(result.openUrl, '_blank', 'noopener,noreferrer');

        const newOutputLines = [...outputLines, { type: 'command', content: activeCommand, cwd }];
        if (result.output) {
            newOutputLines.push({ type: result.error ? 'error' : 'output', content: result.output });
        }
        setOutputLines(newOutputLines);

        if (result.cwd) setCwd(result.cwd);
    };

    // Live filtering: recompute candidates while the suggestion row is visible.
    const handleInputChange = (value) => {
        setInputValue(value);
        if (suggestions.length) {
            setSuggestions(value.trim() ? complete(value, cwd).matches : []);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            // Tab completes to the longest common prefix; when it can't make
            // progress, show a live suggestion row (zsh/fish style) — never
            // print candidates into the scrollback.
            const { completed, matches } = complete(inputValue, cwd);
            if (completed && completed !== inputValue) {
                setInputValue(completed);
                setHistoryIndex(-1);
                // Unique completion → nothing left to suggest; otherwise keep
                // an already-visible row in sync with the new input.
                setSuggestions((prev) => (matches.length > 1 && prev.length ? matches : []));
            } else if (matches.length > 1) {
                setSuggestions(matches);
            } else {
                setSuggestions([]);
            }
            return;
        }
        if (e.key === 'Escape') {
            if (suggestions.length) {
                // Dismiss the suggestion row first; a second Esc reaches the
                // window listener that restores a maximized window.
                e.stopPropagation();
                setSuggestions([]);
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            setOutputLines([]);
            setMenuActive(false);
            setSuggestions([]);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const idx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(idx);
                setInputValue(commandHistory[idx]);
                setSuggestions([]); // full input replacement — stale candidates
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const idx = historyIndex + 1;
                if (idx >= commandHistory.length) { setHistoryIndex(-1); setInputValue(''); }
                else { setHistoryIndex(idx); setInputValue(commandHistory[idx]); }
                setSuggestions([]);
            }
        }
    };

    return (
        <>
        <SEO
            title="Agrim Sigdel — Terminal"
            description="Explore Agrim Sigdel's portfolio through an interactive terminal. Type 'help' to get started."
            url="https://agrimsigdel.com.np/terminal"
        />
        <div
            onClick={handleTerminalClick}
            style={{
                width: '100vw', minHeight: '100dvh', height: '100dvh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: maximized ? 0 : 'min(4vh, 36px) min(4vw, 48px)', boxSizing: 'border-box',
                background: 'radial-gradient(ellipse at 30% 20%, #131a26 0%, #0a0d12 60%, #06080b 100%)',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace", position: 'relative', overflow: 'hidden',
                transition: 'padding 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}
        >
            <style>{`
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
                .term-scroll::-webkit-scrollbar { width: 8px; }
                .term-scroll::-webkit-scrollbar-track { background: transparent; }
                .term-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
                .term-scroll::-webkit-scrollbar-thumb:hover { background: ${C.dimmer}; }
                .term-touch-hint { display: none; }
                @media (hover: none) { .term-touch-hint { display: inline; color: ${C.dim}; font-size: 0.7rem; margin-left: 8px; } }
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
                    maxHeight: maximized ? '100dvh' : 760,
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
                role="main"
                style={{
                    width: '100%', height: '100%', zIndex: 2,
                    display: 'flex', flexDirection: 'column', position: 'relative',
                    background: C.bg, overflow: 'hidden',
                    border: `1px solid ${C.border}`,
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
                }}
              >
                <TitleBar
                    cwd={cwd}
                    maximized={maximized}
                    onClose={() => { setShowMenu(false); setMaximized(false); setWindowState('closed'); }}
                    onMinimize={() => { setShowMenu(false); setWindowState('minimized'); }}
                    onMaximize={() => setMaximized((m) => !m)}
                />

                {/* Scrollable output */}
                <div
                    ref={scrollRef}
                    className="term-scroll"
                    role="log"
                    aria-live="polite"
                    style={{
                        flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 24,
                        paddingBottom: showMenu ? 300 : 24,
                        boxSizing: 'border-box', position: 'relative',
                    }}
                >
                    {outputLines.map((line, i) => (
                        <div key={i} style={{ marginBottom: line.type === 'command' ? 4 : 12 }}>
                            {line.type === 'command' ? (
                                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                    <Prompt path={line.cwd || HOME} />
                                    <span style={{ color: C.text, fontSize: '0.875rem' }}>{line.content}</span>
                                </div>
                            ) : (
                                <div style={{ paddingLeft: 2 }}>
                                    {line.type === 'error'
                                        ? <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.875rem', lineHeight: 1.6, color: C.error, whiteSpace: 'pre-wrap' }}>{line.content}</pre>
                                        : <OutputBlock content={line.content} onOpenContact={() => setContactOpen(true)} />}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Live input row */}
                    <form
                        onSubmit={(e) => handleSubmit(e, inputValue)}
                        style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 }}
                    >
                        <Prompt path={cwd} />
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: C.text, fontSize: '0.875rem', whiteSpace: 'pre' }}>{inputValue}</span>
                            <span style={{
                                display: 'inline-block', width: '8px', height: '1.05em',
                                background: C.accent, marginLeft: 1, borderRadius: 1,
                                animation: 'blink 1.1s step-end infinite',
                            }} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                                spellCheck="false"
                                aria-label="Terminal command input"
                                style={{
                                    position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                                    // 16px stops iOS zoom-on-focus; the input is invisible so size has no visual effect.
                                    opacity: 0, cursor: 'text', fontSize: 16,
                                }}
                            />
                        </div>
                        <span className="term-touch-hint">tap ❯_ below to explore</span>
                    </form>
                </div>

                {/* Live completion candidates — pinned below the input row,
                    outside the role="log" container */}
                <SuggestionRow suggestions={suggestions} fragment={fragmentOf(inputValue)} />

                <StatusBar cwd={cwd} itemCount={itemCount} />

                {/* Floating menu toggle */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    title="Command palette"
                    aria-label="Command palette"
                    aria-expanded={showMenu}
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
                                borderTop: `1px solid ${C.border}`, padding: '16px 24px 24px',
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
        </>
    );
};

export default Terminal;
