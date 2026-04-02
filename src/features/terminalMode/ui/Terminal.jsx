import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCommand } from '../lib/CommandParser';
import { getWelcomeView } from '../lib/TerminalViews';
import '../../../styles/terminal.css';

// Fullscreen CRT Terminal
const Terminal = ({ onSwitchToFun, onSwitchToNormal, onResetMode }) => {
    const [outputLines, setOutputLines] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentView, setCurrentView] = useState('welcome');
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [showKeyboard, setShowKeyboard] = useState(false);

    const inputRef = useRef(null);
    const terminalOutputRef = useRef(null);

    // Initial Welcome
    useEffect(() => {
        setOutputLines([{ type: 'output', content: getWelcomeView() }]);
    }, []);

    // Auto Scroll
    useEffect(() => {
        if (terminalOutputRef.current) {
            terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
        }
    }, [outputLines]);

    // Keep Focus
    useEffect(() => {
        if (!showKeyboard) inputRef.current?.focus();
    }, [showKeyboard]);

    const handleTerminalClick = () => {
        if (!showKeyboard) inputRef.current?.focus();
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
                const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInputValue(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const newIndex = historyIndex + 1;
                if (newIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setInputValue('');
                } else {
                    setHistoryIndex(newIndex);
                    setInputValue(commandHistory[newIndex]);
                }
            }
        }
    };

    const handleNumpadPress = (key) => {
        if (key === 'ENT') {
            handleSubmit(null, inputValue);
        } else if (key === 'CLR') {
            setInputValue('');
        } else if (key === 'BACK') {
            setInputValue(prev => prev.slice(0, -1));
        } else {
            setInputValue(prev => prev + key);
        }
    };

    return (
        <div className="terminal-crt-container" onClick={handleTerminalClick} style={{
            width: '100vw',
            height: '100vh',
            background: '#050a05', /* Dark Greenish black */
            overflow: 'hidden',
            position: 'relative',
            fontFamily: "'Courier New', Courier, monospace",
            color: '#00ff41'
        }}>
            
            {/* CRT OVERLAYS */}
            <div className="scanlines" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 4px, 6px 100%',
                zIndex: 100, pointerEvents: 'none', opacity: 0.8
            }} />
            <div className="crt-flicker" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0, 255, 65, 0.02)',
                zIndex: 101, pointerEvents: 'none',
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)'
            }} />

            {/* TERMINAL CONTENT */}
            <div className="terminal-body" style={{ 
                height: '100%', width: '100%', padding: '30px', paddingBottom: showKeyboard ? '280px' : '80px',
                display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowY: 'auto'
            }} ref={terminalOutputRef}>
                
                <div style={{ textShadow: '0 0 10px rgba(0,255,65,0.7)' }}>
                    {outputLines.map((line, index) => (
                        <div key={index} style={{ marginBottom: '10px', wordWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            {line.type === 'command' && (
                                <span style={{ color: '#00ff41', fontWeight: 'bold' }}>agrim@sys:~$ </span>
                            )}
                            <span style={{ color: line.type === 'error' ? '#ff3333' : '#00ff41' }}>{line.content}</span>
                        </div>
                    ))}
                </div>

                <form onSubmit={(e) => handleSubmit(e, inputValue)} style={{ display: 'flex', marginTop: '10px', position: 'relative' }}>
                    <span style={{ color: '#00ff41', fontWeight: 'bold', marginRight: '10px', textShadow: '0 0 10px rgba(0,255,65,0.7)' }}>agrim@sys:~$ </span>
                    
                    {/* Visual Overlay of Typed Text + Trailing Cursor Block */}
                    <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <span style={{ color: '#00ff41', whiteSpace: 'pre', textShadow: '0 0 10px rgba(0,255,65,0.7)' }}>{inputValue}</span>
                        <span className="cursor-blink" style={{ background: '#00ff41', width: '10px', height: '1.2em', display: 'inline-block', marginLeft: '2px', animation: 'blink 1s step-end infinite' }} />
                    </div>

                    {/* Invisible Actual Input placed physically over the text line to capture events */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        spellCheck="false"
                        style={{ 
                            position: 'absolute', top: 0, left: '100px', width: '100%', height: '100%', cursor: 'text',
                            background: 'transparent', border: 'none', color: 'transparent', caretColor: 'transparent',
                            outline: 'none', fontFamily: 'inherit', fontSize: '1rem'
                        }}
                    />
                </form>
            </div>

            {/* MENU TOGGLE BUTTON */}
            <button 
                onClick={(e) => { e.stopPropagation(); setShowKeyboard(!showKeyboard); }}
                style={{
                    position: 'absolute', bottom: '30px', right: '30px', zIndex: 200,
                    background: showKeyboard ? '#ff3333' : '#00ff41', color: '#000', border: 'none', borderRadius: '50%',
                    width: '60px', height: '60px', cursor: 'pointer', fontWeight: 'bold',
                    boxShadow: showKeyboard ? '0 0 20px rgba(255,51,51,0.4)' : '0 0 20px rgba(0,255,65,0.4)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease'
                }}
            >
                {showKeyboard ? (
                    <span style={{ fontSize: '1.2rem' }}>✕</span>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                )}
            </button>

            {/* ON-SCREEN QUICK MENU OVERLAY */}
            <AnimatePresence>
                {showKeyboard && (
                    <motion.div
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                            position: 'absolute', bottom: '0', left: '0', width: '100%',
                            background: 'rgba(5, 10, 5, 0.95)', backdropFilter: 'blur(10px)',
                            borderTop: '2px solid #00ff41', padding: '20px', zIndex: 150,
                            display: 'flex', justifyContent: 'center', boxSizing: 'border-box'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', maxWidth: '500px', width: '100%'
                        }}>
                            {['ABOUT', 'PROJECTS', 'EXPERIENCE', 'SKILLS', 'CONTACT', 'MENU', 'CLEAR'].map(cmd => (
                                <button 
                                    key={cmd} 
                                    onClick={() => {
                                        handleSubmit(null, cmd.toLowerCase());
                                        setShowKeyboard(false); 
                                    }}
                                    style={{
                                        padding: '15px', background: 'rgba(0, 255, 65, 0.1)', color: '#00ff41',
                                        border: '1px solid #00ff41', borderRadius: '8px', cursor: 'pointer',
                                        fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold',
                                        textShadow: '0 0 5px #00ff41', letterSpacing: '2px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 255, 65, 0.3)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'}
                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {cmd}
                                </button>
                            ))}
                            <button 
                                onClick={() => { handleSubmit(null, 'fun'); setShowKeyboard(false); }}
                                style={{
                                    padding: '15px', background: 'rgba(0, 240, 181, 0.15)', color: '#00f0b5',
                                    border: '1px solid #00f0b5', borderRadius: '8px', cursor: 'pointer',
                                    fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px'
                                }}
                            >
                                FUN MODE
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            `}</style>
        </div>
    );
};

export default Terminal;
