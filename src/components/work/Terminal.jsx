import React, { useState, useEffect, useRef } from 'react';
import { parseCommand } from './CommandParser';
import { getWelcomeView } from './TerminalViews';
import '../../styles/terminal.css';

const Terminal = ({ onSwitchToFun, onSwitchToNormal, onResetMode }) => {
    const [outputLines, setOutputLines] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentView, setCurrentView] = useState('welcome');
    const [navigationHistory, setNavigationHistory] = useState([]);

    const inputRef = useRef(null);
    const terminalOutputRef = useRef(null);

    // Show welcome screen on mount
    useEffect(() => {
        setOutputLines([
            { type: 'output', content: getWelcomeView() },
        ]);
    }, []);

    // Auto-scroll to bottom when new output is added
    useEffect(() => {
        if (terminalOutputRef.current) {
            terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
        }
    }, [outputLines]);

    // Focus input on mount and when clicking terminal
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleTerminalClick = () => {
        inputRef.current?.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        // Add command to output
        const newOutputLines = [
            ...outputLines,
            { type: 'command', content: inputValue },
        ];

        // Parse command
        const result = parseCommand(inputValue.trim(), currentView, navigationHistory);

        // Handle clear command
        if (result.clearScreen) {
            setOutputLines([]);
            setInputValue('');
            setCurrentView('welcome');
            setNavigationHistory([]);
            return;
        }

        // Handle start command (reset mode selection)
        if (result.resetMode && onResetMode) {
            onResetMode();
            return;
        }

        // Handle close/minimize commands (switch to FUN mode)
        if (result.switchToFun && onSwitchToFun) {
            onSwitchToFun();
            return;
        }

        // Handle minimize/normal commands (switch to NORMAL mode)
        if (result.switchToNormal && onSwitchToNormal) {
            onSwitchToNormal();
            return;
        }

        // Handle maximize command (toggle fullscreen)
        if (result.toggleFullscreen) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        // Add result to output
        if (result.output) {
            newOutputLines.push({ type: result.error ? 'error' : 'output', content: result.output });
        }

        setOutputLines(newOutputLines);

        // Update navigation history
        if (result.view !== currentView && !result.isBack && !result.error) {
            setNavigationHistory([...navigationHistory, currentView]);
        } else if (result.isBack && navigationHistory.length > 0) {
            setNavigationHistory(navigationHistory.slice(0, -1));
        }

        // Update current view
        if (result.view) {
            setCurrentView(result.view);
        }

        // Add to command history
        setCommandHistory([...commandHistory, inputValue]);
        setHistoryIndex(-1);
        setInputValue('');
    };

    const handleKeyDown = (e) => {
        // Arrow up - previous command
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex === -1
                    ? commandHistory.length - 1
                    : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInputValue(commandHistory[newIndex]);
            }
        }
        // Arrow down - next command
        else if (e.key === 'ArrowDown') {
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

    return (
        <div className="terminal-container" onClick={handleTerminalClick}>
            <div className="terminal-body">
                <div className="terminal-output" ref={terminalOutputRef}>
                    {outputLines.map((line, index) => (
                        <div key={index} className={`terminal-line terminal-line-${line.type}`}>
                            {line.type === 'command' && (
                                <span className="terminal-prompt">user@portfolio:~$ </span>
                            )}
                            <pre className="terminal-text">{line.content}</pre>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="terminal-input-line">
                    <span className="terminal-prompt">user@portfolio:~$ </span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="terminal-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        spellCheck="false"
                    />
                    <span className="terminal-cursor">█</span>
                </form>
            </div>
        </div>
    );
};

export default Terminal;
