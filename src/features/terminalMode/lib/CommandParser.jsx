import {
    getWelcomeView,
    getHelpView,
    getMenuView,
    getAboutView,
    getResearchView,
    getProjectsView,
    getExperienceView,
    getSkillsView,
    getContactView,
    getTreeView,
    getNeofetchView,
    getManView,
    FILES,
} from './TerminalViews';

/*
 * Single source of truth for every terminal command.
 *
 * Each entry:
 *   name        canonical command name
 *   aliases     alternate spellings that resolve to this command
 *   group       help section it appears under (null = hidden from help)
 *   args        short usage hint shown in help/man (optional)
 *   description one-liner for help + man
 *   handler     (ctx) => result, where ctx = { args, currentView, navigationHistory, commandHistory }
 *
 * A result may contain: { output, view, error, clearScreen, resetMode,
 *                         switchToFun, switchToNormal, toggleFullscreen, isBack }
 */

const sectionViews = {
    about: getAboutView,
    research: getResearchView,
    projects: getProjectsView,
    experience: getExperienceView,
    skills: getSkillsView,
    contact: getContactView,
    menu: getMenuView,
    help: getHelpView,
    welcome: getWelcomeView,
};

// Open a portfolio section (used by name, number, `cd`, and `cat`).
const openSection = (name) => ({ output: sectionViews[name](), view: name });

export const COMMANDS = [
    /* ─── Navigation ─────────────────────────────────────────────── */
    {
        name: 'ls', aliases: ['dir', 'll'], group: 'Navigation',
        description: 'list portfolio sections',
        handler: () => ({
            output: `\ntotal ${Object.keys(FILES).length}\n${Object.values(FILES)
                .map((f) => `  ${f.name.padEnd(18)}${f.label}`)
                .join('\n')}\n`,
            view: 'ls',
        }),
    },
    {
        name: 'cd', aliases: [], group: 'Navigation', args: '<section>',
        description: 'open a section  (cd .. = back, cd ~ = home)',
        handler: ({ args, navigationHistory }) => {
            const target = (args[0] || '~').toLowerCase().replace(/\.(md|json|vcf|pdf|log)$/, '');
            if (target === '~' || target === '/' || target === 'home') return openSection('welcome');
            if (target === '..' || target === '-') return runByName('back', { navigationHistory });
            if (sectionViews[target]) return openSection(target);
            return notFound(`cd: no such section: ${args[0] || ''}`);
        },
    },
    {
        name: 'cat', aliases: [], group: 'Navigation', args: '<file>',
        description: 'print a section to the screen',
        handler: ({ args }) => {
            if (!args[0]) return notFound('cat: missing file operand');
            const key = args[0].toLowerCase().replace(/\.(md|json|vcf|pdf|log)$/, '');
            const file = FILES[key];
            if (file) return openSection(file.section);
            return notFound(`cat: ${args[0]}: No such file or directory`);
        },
    },
    {
        name: 'pwd', aliases: [], group: 'Navigation',
        description: 'print working directory',
        handler: ({ currentView }) => ({
            output: `\n/home/agrim/portfolio${currentView === 'welcome' ? '' : '/' + currentView}\n`,
            view: currentView,
        }),
    },
    {
        name: 'tree', aliases: [], group: 'Navigation',
        description: 'show the portfolio as a directory tree',
        handler: () => ({ output: getTreeView(), view: 'tree' }),
    },
    {
        name: 'back', aliases: ['b'], group: 'Navigation',
        description: 'return to the previous view',
        handler: ({ navigationHistory }) => {
            if (navigationHistory.length > 0) {
                const prev = navigationHistory[navigationHistory.length - 1];
                return { output: (sectionViews[prev] || getMenuView)(), view: prev, isBack: true };
            }
            return { output: "\nAlready at home. Type 'menu' to see options.\n", view: 'welcome' };
        },
    },

    /* ─── Portfolio ──────────────────────────────────────────────── */
    { name: 'about', aliases: [], group: 'Portfolio', description: 'professional summary & education', handler: () => openSection('about') },
    { name: 'research', aliases: [], group: 'Portfolio', description: 'publications & the CATD framework', handler: () => openSection('research') },
    { name: 'projects', aliases: [], group: 'Portfolio', description: 'portfolio of work & achievements', handler: () => openSection('projects') },
    { name: 'experience', aliases: ['exp'], group: 'Portfolio', description: 'career history & roles', handler: () => openSection('experience') },
    { name: 'skills', aliases: [], group: 'Portfolio', description: 'technical toolkit & expertise', handler: () => openSection('skills') },
    { name: 'contact', aliases: [], group: 'Portfolio', description: 'get in touch', handler: () => openSection('contact') },
    { name: 'menu', aliases: [], group: 'Portfolio', description: 'show the main menu of sections', handler: () => openSection('menu') },

    /* ─── System ─────────────────────────────────────────────────── */
    {
        name: 'help', aliases: ['?', '--help', '-h'], group: 'System',
        description: 'show this help message',
        handler: () => ({ output: getHelpView(), view: 'help' }),
    },
    {
        name: 'man', aliases: [], group: 'System', args: '<command>',
        description: 'show the manual for a command',
        handler: ({ args }) => {
            const cmd = resolve(args[0] || '');
            if (!cmd) return notFound(`No manual entry for ${args[0] || ''}`);
            return { output: getManView(cmd), view: 'man' };
        },
    },
    {
        name: 'whoami', aliases: [], group: 'System',
        description: 'print the current user',
        handler: () => ({ output: getNeofetchView({ short: true }), view: 'whoami' }),
    },
    {
        name: 'neofetch', aliases: ['fetch'], group: 'System',
        description: 'display system & profile info',
        handler: () => ({ output: getNeofetchView(), view: 'neofetch' }),
    },
    {
        name: 'echo', aliases: [], group: 'System', args: '<text>',
        description: 'print text back to the screen',
        handler: ({ args }) => ({ output: `\n${args.join(' ')}\n`, view: 'echo' }),
    },
    {
        name: 'date', aliases: [], group: 'System',
        description: 'print the current date & time',
        handler: () => ({ output: `\n${new Date().toString()}\n`, view: 'date' }),
    },
    {
        name: 'history', aliases: [], group: 'System',
        description: 'show command history',
        handler: ({ commandHistory }) => ({
            output: commandHistory.length
                ? `\n${commandHistory.map((c, i) => `  ${String(i + 1).padStart(3)}  ${c}`).join('\n')}\n`
                : '\nNo commands yet.\n',
            view: 'history',
        }),
    },
    {
        name: 'clear', aliases: ['cls'], group: 'System',
        description: 'clear the terminal screen',
        handler: () => ({ output: '', view: 'clear', clearScreen: true }),
    },
    {
        name: 'sudo', aliases: [], group: null, args: '<command>',
        description: 'execute a command as superuser',
        handler: ({ args }) => ({
            output: `\nagrim is not in the sudoers file. This incident will be reported. 😏\n${args.length ? `(nice try with "${args.join(' ')}")\n` : ''}`,
            view: 'sudo', error: true,
        }),
    },

    /* ─── Mode ───────────────────────────────────────────────────── */
    { name: 'fun', aliases: ['close'], group: 'Mode', description: 'switch to FUN mode', handler: () => ({ output: 'Switching to FUN mode...\n', view: 'fun', switchToFun: true }) },
    { name: 'normal', aliases: ['minimize'], group: 'Mode', description: 'switch to NORMAL mode', handler: () => ({ output: 'Switching to NORMAL mode...\n', view: 'normal', switchToNormal: true }) },
    { name: 'fullscreen', aliases: ['maximize'], group: 'Mode', description: 'toggle fullscreen', handler: () => ({ output: 'Toggling fullscreen...\n', view: 'fullscreen', toggleFullscreen: true }) },
    { name: 'exit', aliases: ['start', 'quit', 'logout'], group: 'Mode', description: 'return to mode selection', handler: () => ({ output: 'Returning to mode selection...\n', view: 'exit', resetMode: true }) },
];

/* ─── Lookup helpers ─────────────────────────────────────────────── */

// name/alias -> command object
const LOOKUP = (() => {
    const map = {};
    for (const cmd of COMMANDS) {
        map[cmd.name] = cmd;
        for (const a of cmd.aliases) map[a] = cmd;
    }
    return map;
})();

// Numbered shortcuts mirror the main menu order.
const NUMBER_MAP = { '1': 'about', '2': 'research', '3': 'projects', '4': 'experience', '5': 'skills', '6': 'contact' };

export const resolve = (token) => LOOKUP[String(token).toLowerCase()] || null;

// All visible names for tab-completion (canonical names + aliases that are real words).
export const COMPLETIONS = [
    ...COMMANDS.map((c) => c.name),
    ...Object.keys(NUMBER_MAP),
].sort();

// Commands whose argument is a file/section name (so `cat a<Tab>` completes filenames).
const FILE_ARG_COMMANDS = { cat: 'name', cd: 'section', man: 'cmd' };

// Filenames (with extensions) and bare section names, for argument completion.
const FILE_NAMES = Object.values(FILES).map((f) => f.name);
const SECTION_NAMES = Object.keys(FILES);

/*
 * Context-aware completion for the whole input line.
 * Returns { completed, matches } where:
 *   completed = the full line to set if there's a single unambiguous completion (else null)
 *   matches   = all candidate tokens (for showing a list when ambiguous)
 * The completion is computed for the LAST word being typed.
 */
export const complete = (input) => {
    const endsWithSpace = /\s$/.test(input);
    const parts = input.split(/\s+/).filter(Boolean);
    const typingArg = parts.length > 1 || (parts.length === 1 && endsWithSpace);

    let pool;
    let fragment;
    let prefix; // everything before the word being completed

    if (!typingArg) {
        // Completing the command itself.
        pool = COMPLETIONS;
        fragment = (parts[0] || '').toLowerCase();
        prefix = '';
    } else {
        const cmd = parts[0].toLowerCase();
        fragment = endsWithSpace ? '' : (parts[parts.length - 1] || '').toLowerCase();
        prefix = input.slice(0, input.length - fragment.length);
        if (FILE_ARG_COMMANDS[cmd] === 'name') pool = FILE_NAMES;
        else if (FILE_ARG_COMMANDS[cmd] === 'section') pool = SECTION_NAMES;
        else if (FILE_ARG_COMMANDS[cmd] === 'cmd') pool = COMMANDS.map((c) => c.name);
        else pool = []; // command takes no completable arg
    }

    const matches = pool.filter((c) => c.toLowerCase().startsWith(fragment));

    if (matches.length === 1) {
        return { completed: prefix + matches[0], matches };
    }
    if (matches.length > 1) {
        // Complete the longest common prefix, then let the user pick.
        const lcp = longestCommonPrefix(matches);
        const completed = lcp.length > fragment.length ? prefix + lcp : null;
        return { completed, matches };
    }
    return { completed: null, matches: [] };
};

const longestCommonPrefix = (arr) => {
    if (!arr.length) return '';
    let p = arr[0];
    for (const s of arr) {
        while (!s.toLowerCase().startsWith(p.toLowerCase())) p = p.slice(0, -1);
        if (!p) break;
    }
    return p;
};

const notFound = (msg) => ({ output: `\n${msg}\n`, view: undefined, error: true });

// Run a command by its canonical name (used internally, e.g. `cd ..` -> back).
const runByName = (name, ctx) => LOOKUP[name].handler({ args: [], ...ctx });

// Suggest the closest command for "command not found".
const suggest = (input) => {
    const near = COMPLETIONS.find((c) => c.startsWith(input[0]) && Math.abs(c.length - input.length) <= 2);
    return near ? `\nDid you mean '${near}'?` : '';
};

/* ─── Public entry point ─────────────────────────────────────────── */

export const parseCommand = (input, currentView, navigationHistory, commandHistory = []) => {
    const raw = input.trim();
    const [head, ...args] = raw.split(/\s+/);
    const token = head.toLowerCase();

    if (NUMBER_MAP[token]) {
        return LOOKUP[NUMBER_MAP[token]].handler({ args, currentView, navigationHistory, commandHistory });
    }

    const cmd = LOOKUP[token];
    if (cmd) {
        const result = cmd.handler({ args, currentView, navigationHistory, commandHistory });
        // Handlers that don't set a view stay on the current one.
        if (result.view === undefined) result.view = currentView;
        return result;
    }

    return {
        output: `\ncommand not found: ${head}${suggest(token)}\nType 'help' for available commands.\n`,
        view: currentView,
        error: true,
    };
};
