import {
    CONTACT_ACTION,
    HOME,
    resolvePath,
    getNode,
    childNames,
    displayName,
} from './vfs';
import { getMenuView, getNeofetchView, getWhoamiView, MENU } from './TerminalViews';

/*
 * Single source of truth for every terminal command.
 *
 * Each entry:
 *   name        canonical command name
 *   aliases     alternate spellings that resolve to this command
 *   group       help section ('filesystem' | 'terminal' | 'site'; null = hidden)
 *   args        usage hint shown in help/man (optional)
 *   description one-liner for help + man
 *   manual      longer text for `man` (optional)
 *   handler     (ctx) => result, ctx = { args, rawArgs, cwd, commandHistory }
 *
 * A result may contain: { output, error, cwd, clearScreen, isMenu,
 *   openContact, openUrl, resetMode, switchToFun, switchToNormal, toggleFullscreen }
 */

const err = (output) => ({ output, error: true });

/* ─── output formatting helpers ──────────────────────────────────── */

// Lay names out in ls-style columns.
const columns = (names, width = 64) => {
    if (!names.length) return '';
    const colw = Math.max(...names.map((n) => n.length)) + 2;
    const per = Math.max(1, Math.floor(width / colw));
    const rows = [];
    for (let i = 0; i < names.length; i += per) {
        rows.push(
            names
                .slice(i, i + per)
                .map((n, j, row) => (j === row.length - 1 ? n : n.padEnd(colw)))
                .join('')
        );
    }
    return rows.join('\n');
};

const longRow = (node) => {
    const isDir = node.type === 'dir';
    const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
    const size = isDir
        ? 64 + 32 * Object.keys(node.children).length
        : node.binary ? node.size : node.content.length;
    return `${perms}  agrim  ${String(size).padStart(7)}  ${displayName(node)}`;
};

// Recursive box-drawing tree of a directory node.
const treeLines = (node, prefix = '') => {
    const names = childNames(node);
    return names.flatMap((name, i) => {
        const child = node.children[name];
        const last = i === names.length - 1;
        const line = `${prefix}${last ? '└── ' : '├── '}${displayName(child)}`;
        return child.type === 'dir'
            ? [line, ...treeLines(child, prefix + (last ? '    ' : '│   '))]
            : [line];
    });
};

const treeCounts = (node) => {
    let dirs = 0, files = 0;
    for (const name of childNames(node)) {
        const child = node.children[name];
        if (child.type === 'dir') {
            dirs += 1;
            const sub = treeCounts(child);
            dirs += sub.dirs;
            files += sub.files;
        } else files += 1;
    }
    return { dirs, files };
};

// Shared path→node lookup with a per-command error prefix.
const lookup = (cmd, target, cwd) => {
    const path = resolvePath(cwd, target);
    const node = getNode(path);
    if (!node) return { error: err(`${cmd}: ${target}: no such file or directory`) };
    return { node, path };
};

/* ─── command registry ───────────────────────────────────────────── */

export const COMMANDS = [
    /* ── filesystem ── */
    {
        name: 'ls', aliases: ['ll', 'dir'], group: 'filesystem', args: '[path]',
        description: 'list directory contents',
        manual: "Lists the contents of a directory (default: the current one). Directories are shown with a trailing '/'. Use 'ls -l' for a long listing with sizes.",
        handler: ({ args, cwd }) => {
            const long = args.some((a) => /^-l/.test(a) || a === '-al' || a === '-la');
            const target = args.find((a) => !a.startsWith('-'));
            const { node, error } = lookup('ls', target ?? '.', cwd);
            if (error) return error;
            if (node.type === 'file') return { output: long ? longRow(node) : node.name };
            const kids = childNames(node).map((n) => node.children[n]);
            if (!kids.length) return { output: '' };
            return {
                output: long
                    ? kids.map(longRow).join('\n')
                    : columns(kids.map(displayName)),
            };
        },
    },
    {
        name: 'cd', aliases: [], group: 'filesystem', args: '<path>',
        description: 'change directory',
        manual: "Moves into a directory. Supports relative paths, '..', '.', '~' and '/'. Bare 'cd' returns home.",
        handler: ({ args, cwd }) => {
            const target = args[0];
            if (!target) return { output: '', cwd: HOME };
            const path = resolvePath(cwd, target);
            const node = getNode(path);
            if (!node) return err(`cd: no such file or directory: ${target}`);
            if (node.type !== 'dir') return err(`cd: not a directory: ${target}`);
            return { output: '', cwd: path };
        },
    },
    {
        name: 'cat', aliases: [], group: 'filesystem', args: '<file>',
        description: 'print a file',
        manual: "Prints a text file to the terminal. Binary files (like resume.pdf) can't be printed — use 'open' for those.",
        handler: ({ args, cwd }) => {
            if (!args[0]) return err('cat: missing operand');
            const { node, error } = lookup('cat', args[0], cwd);
            if (error) return error;
            if (node.type === 'dir') return err(`cat: ${args[0]}: is a directory`);
            if (node.binary) return err(`cat: ${node.name}: binary file (use 'open ${node.name}')`);
            return { output: node.content };
        },
    },
    {
        name: 'head', aliases: [], group: 'filesystem', args: '<file>',
        description: 'first 10 lines of a file',
        handler: ({ args, cwd }) => {
            if (!args[0]) return err('head: missing operand');
            const { node, error } = lookup('head', args[0], cwd);
            if (error) return error;
            if (node.type === 'dir') return err(`head: ${args[0]}: is a directory`);
            if (node.binary) return err(`head: ${node.name}: binary file`);
            return { output: node.content.split('\n').slice(0, 10).join('\n') };
        },
    },
    {
        name: 'open', aliases: [], group: 'filesystem', args: '<file>',
        description: 'open a file (PDFs open in a new tab)',
        manual: 'Opens a file. PDFs (resume.pdf, research/catd-paper.pdf) open in a new browser tab; text files are printed like cat.',
        handler: ({ args, cwd }) => {
            if (!args[0]) return err('open: missing operand');
            const { node, error } = lookup('open', args[0], cwd);
            if (error) return error;
            if (node.type === 'dir') return err(`open: ${args[0]}: is a directory`);
            if (node.binary && node.href) return { output: `opening ${node.name}…`, openUrl: node.href };
            return { output: node.content };
        },
    },
    {
        name: 'grep', aliases: [], group: 'filesystem', args: '<term> [path]',
        description: 'search file contents',
        manual: 'Case-insensitive substring search across all text files under a path (default: the current directory). Prints up to 20 matching lines.',
        handler: ({ args, cwd }) => {
            const [term, target] = args;
            if (!term) return err('usage: grep <term> [path]');
            const { node, error } = lookup('grep', target ?? '.', cwd);
            if (error) return error;
            const MAX = 20;
            const results = [];
            const visit = (n, rel) => {
                if (results.length > MAX) return;
                if (n.type === 'dir') {
                    for (const name of childNames(n)) visit(n.children[name], rel ? `${rel}/${name}` : name);
                } else if (!n.binary) {
                    for (const line of n.content.split('\n')) {
                        if (results.length > MAX) return;
                        if (line.trim() === CONTACT_ACTION) continue;
                        if (line.toLowerCase().includes(term.toLowerCase())) {
                            results.push(`${rel || n.name}: ${line.trim()}`);
                        }
                    }
                }
            };
            visit(node, node.type === 'dir' ? '' : (target || node.name));
            if (!results.length) return { output: `grep: no matches for '${term}'` };
            const truncated = results.length > MAX;
            return {
                output: results.slice(0, MAX).join('\n') + (truncated ? `\n… (showing first ${MAX} matches)` : ''),
            };
        },
    },
    {
        name: 'tree', aliases: [], group: 'filesystem', args: '[path]',
        description: 'directory tree',
        handler: ({ args, cwd }) => {
            const { node, path, error } = lookup('tree', args[0] ?? '.', cwd);
            if (error) return error;
            if (node.type === 'file') return { output: node.name };
            const { dirs, files } = treeCounts(node);
            return { output: [path, ...treeLines(node), '', `${dirs} directories, ${files} files`].join('\n') };
        },
    },
    {
        name: 'pwd', aliases: [], group: 'filesystem',
        description: 'print working directory',
        handler: ({ cwd }) => ({ output: `/home/agrim${cwd.slice(1)}` }),
    },

    /* ── terminal ── */
    {
        name: 'help', aliases: ['?', '--help', '-h'], group: 'terminal',
        description: 'this list',
        handler: () => ({ output: getHelpView() }),
    },
    {
        name: 'man', aliases: [], group: 'terminal', args: '<cmd>',
        description: 'manual for a command',
        handler: ({ args }) => {
            const cmd = resolve(args[0] || '');
            if (!cmd) return err(`man: no manual entry for ${args[0] || '(none)'}`);
            return { output: getManView(cmd) };
        },
    },
    {
        name: 'history', aliases: [], group: 'terminal',
        description: 'command history',
        handler: ({ commandHistory }) => ({
            output: commandHistory.length
                ? commandHistory.map((c, i) => `  ${String(i + 1).padStart(3)}  ${c}`).join('\n')
                : 'no commands yet',
        }),
    },
    {
        name: 'clear', aliases: ['cls'], group: 'terminal',
        description: 'clear the screen (Ctrl+L)',
        handler: () => ({ output: '', clearScreen: true }),
    },
    {
        name: 'whoami', aliases: [], group: 'terminal',
        description: 'who is this?',
        handler: () => ({ output: getWhoamiView() }),
    },
    {
        name: 'neofetch', aliases: ['fetch'], group: 'terminal',
        description: 'system & profile info',
        handler: () => ({ output: getNeofetchView() }),
    },
    {
        name: 'echo', aliases: [], group: 'terminal', args: '<text>',
        description: 'print text',
        handler: ({ rawArgs }) => ({ output: rawArgs || '' }),
    },

    /* ── site ── */
    {
        name: 'contact', aliases: [], group: 'site',
        description: 'open the contact form',
        manual: "Opens the message form right in the terminal. For plain details, 'cat ~/contact.txt'.",
        handler: () => ({
            output: "opening contact form… ('cat ~/contact.txt' for plain details)",
            openContact: true,
        }),
    },
    {
        name: 'menu', aliases: [], group: 'site',
        description: 'guided tour (numbered menu)',
        handler: () => ({ output: getMenuView(), isMenu: true }),
    },
    {
        name: 'portfolio', aliases: ['fun'], group: 'site',
        description: 'switch to the visual portfolio',
        handler: () => ({ output: 'switching to the visual portfolio…', switchToFun: true }),
    },
    {
        name: 'cv', aliases: ['resume', 'normal'], group: 'site',
        description: 'switch to the classic CV view',
        handler: () => ({ output: 'switching to the classic CV…', switchToNormal: true }),
    },
    {
        name: 'exit', aliases: ['home', 'quit', 'logout', 'start'], group: 'site',
        description: 'back to mode selection',
        handler: () => ({ output: 'returning to mode selection…', resetMode: true }),
    },

    /* ── hidden ── */
    {
        name: 'fullscreen', aliases: ['maximize'], group: null,
        description: 'toggle fullscreen',
        handler: () => ({ output: 'toggling fullscreen…', toggleFullscreen: true }),
    },
    {
        name: 'sudo', aliases: [], group: null, args: '<command>',
        description: 'execute a command as superuser',
        handler: ({ rawArgs }) => {
            if (rawArgs.replace(/\s+/g, ' ').trim() === 'hire-me') {
                return {
                    output: [
                        '[sudo] password for visitor: ········',
                        'access granted — recruitment protocol initiated',
                        '',
                        '  ✓ resume located          open ~/resume.pdf',
                        '  ✓ references compiled     ls ~/experience',
                        '  ✓ channel established     sigdelagrim35@gmail.com',
                        '',
                        "Let's build something. Type 'contact' to send a message.",
                    ].join('\n'),
                };
            }
            return err(`agrim is not in the sudoers file. This incident will be reported. 😏${rawArgs ? `\n(nice try with "${rawArgs}")` : ''}`);
        },
    },
];

/* ─── lookup tables ──────────────────────────────────────────────── */

const LOOKUP = (() => {
    const map = {};
    for (const cmd of COMMANDS) {
        map[cmd.name] = cmd;
        for (const a of cmd.aliases) map[a] = cmd;
    }
    return map;
})();

export const resolve = (token) => LOOKUP[String(token).toLowerCase()] || null;

// Visible command names for completion + "did you mean".
const COMMAND_NAMES = COMMANDS.filter((c) => c.group).map((c) => c.name).sort();

/* ─── help / man views (generated from the registry) ─────────────── */

const usage = (c) => `${c.name}${c.args ? ' ' + c.args : ''}`;

export const getHelpView = () => {
    const GROUP_ORDER = ['filesystem', 'terminal', 'site'];
    const pad = Math.max(...COMMANDS.filter((c) => c.group).map((c) => usage(c).length)) + 4;
    const body = GROUP_ORDER
        .map((g) => {
            const rows = COMMANDS
                .filter((c) => c.group === g)
                .map((c) => `  ${usage(c).padEnd(pad)}${c.description}`)
                .join('\n');
            return `${g}\n${rows}`;
        })
        .join('\n\n');
    return `${body}\n\nTab completes commands & paths  ·  ↑↓ history  ·  Ctrl+L clear  ·  man <cmd> for details`;
};

export const getManView = (cmd) => {
    const aliases = cmd.aliases.filter((a) => /^[a-z]/.test(a));
    return [
        'NAME',
        `    ${cmd.name} — ${cmd.description}`,
        '',
        'SYNOPSIS',
        `    ${usage(cmd)}`,
        ...(cmd.manual ? ['', 'DESCRIPTION', ...cmd.manual.split('\n').map((l) => `    ${l}`)] : []),
        ...(aliases.length ? ['', 'ALIASES', `    ${aliases.join(', ')}`] : []),
    ].join('\n');
};

/* ─── tab completion (deliberate, bash-style) ────────────────────── */

// Commands whose Nth+ argument is a path (1-based arg index).
const PATH_ARG_AT = { ls: 1, cd: 1, cat: 1, head: 1, open: 1, tree: 1, grep: 2 };

const longestCommonPrefix = (arr) => {
    if (!arr.length) return '';
    let p = arr[0];
    for (const s of arr) {
        while (p && !s.toLowerCase().startsWith(p.toLowerCase())) p = p.slice(0, -1);
        if (!p) break;
    }
    return p;
};

// Shared tail: unique match → full completion; several → longest common prefix.
const finish = (prefix, frag, rawNames, displays, insertions) => {
    if (!rawNames.length) return { completed: null, matches: [] };
    if (rawNames.length === 1) return { completed: prefix + insertions[0], matches: displays };
    const lcp = longestCommonPrefix(rawNames);
    return {
        completed: lcp.length > frag.length ? prefix + lcp : null,
        matches: displays,
    };
};

/*
 * complete(input, cwd) → { completed, matches }
 *   completed  full replacement line when Tab can make progress (else null)
 *   matches    candidate display names (shown when Tab can't progress)
 *
 * First token completes command names; later tokens complete VFS paths
 * relative to cwd (cd only offers directories). Unique completions append
 * ' ' for files/commands and '/' for directories, like bash.
 */
export const complete = (input, cwd = HOME) => {
    const endsWithSpace = /\s$/.test(input);
    const parts = input.split(/\s+/).filter(Boolean);
    const typingCmd = parts.length === 0 || (parts.length === 1 && !endsWithSpace);

    if (typingCmd) {
        const frag = (parts[0] || '').toLowerCase();
        const names = COMMAND_NAMES.filter((c) => c.startsWith(frag));
        return finish('', frag, names, names, names.map((n) => n + ' '));
    }

    const cmdName = parts[0].toLowerCase();
    const frag = endsWithSpace ? '' : parts[parts.length - 1];
    const before = input.slice(0, input.length - frag.length);
    const argIndex = endsWithSpace ? parts.length : parts.length - 1;

    if (cmdName === 'man') {
        const names = COMMAND_NAMES.filter((c) => c.startsWith(frag.toLowerCase()));
        return finish(before, frag, names, names, names.map((n) => n + ' '));
    }

    if (!PATH_ARG_AT[cmdName] || argIndex < PATH_ARG_AT[cmdName]) {
        return { completed: null, matches: [] };
    }

    // Path completion: split the fragment into a directory part and a basename.
    const slash = frag.lastIndexOf('/');
    const dirPart = slash >= 0 ? frag.slice(0, slash + 1) : '';
    const base = slash >= 0 ? frag.slice(slash + 1) : frag;
    const dirNode = getNode(resolvePath(cwd, dirPart || '.'));
    if (!dirNode || dirNode.type !== 'dir') return { completed: null, matches: [] };

    const kids = childNames(dirNode)
        .map((n) => dirNode.children[n])
        .filter((n) => n.name.toLowerCase().startsWith(base.toLowerCase()))
        .filter((n) => cmdName !== 'cd' || n.type === 'dir');

    return finish(
        before + dirPart,
        base,
        kids.map((n) => n.name),
        kids.map(displayName),
        kids.map((n) => (n.type === 'dir' ? n.name + '/' : n.name + ' '))
    );
};

/* ─── "did you mean" suggestion ──────────────────────────────────── */

const suggest = (input) => {
    if (!input) return '';
    const near = COMMAND_NAMES.find(
        (c) => c.startsWith(input[0]) && Math.abs(c.length - input.length) <= 2
    );
    return near ? `\n(did you mean '${near}'?)` : '';
};

/* ─── public entry point ─────────────────────────────────────────── */

export const parseCommand = (input, ctx = {}) => {
    const { cwd = HOME, commandHistory = [], menuActive = false } = ctx;
    const raw = String(input).trim();
    const [head, ...args] = raw.split(/\s+/);
    const token = head.toLowerCase();
    const rawArgs = raw.slice(head.length).trim();

    // Number keys run menu entries — only while the menu is the last output.
    if (menuActive && /^[0-9]$/.test(token)) {
        const item = MENU.find((m) => m.key === token);
        if (item) {
            const result = parseCommand(item.cmd, { cwd, commandHistory, menuActive: false });
            const echo = `→ ${item.cmd}`;
            return { ...result, output: result.output ? `${echo}\n\n${result.output}` : echo };
        }
    }

    const cmd = LOOKUP[token];
    if (cmd) return cmd.handler({ args, rawArgs, cwd, commandHistory });

    return err(`zsh: command not found: ${head}${suggest(token)}\nType 'help' for available commands.`);
};
