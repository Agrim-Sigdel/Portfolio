import content from '../../../data/content.json';

/*
 * TerminalViews — the few "app-like" screens that aren't files in the VFS:
 * welcome banner, the guided numbered menu, and neofetch/whoami.
 * Everything else (about, projects, …) lives in lib/vfs.js as real files.
 */

const { common } = content;
const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

/* ─── Welcome banner (kept small; scroll container handles overflow) ── */
export const getWelcomeView = () => `
╭─ agrim@portfolio ──────────────────────────╮
│  ${common.personal.name.padEnd(42)}│
│  ${'Full-Stack Developer · AI Researcher'.padEnd(42)}│
╰────────────────────────────────────────────╯

Type 'help' for commands, 'ls' to look around, 'menu' for the guided tour, or 'fx' to play with the 3D backdrop.
`.replace(/^\n+|\n+$/g, '');

/* ─── Guided tour menu (non-technical fallback) ──────────────────────
 * Number keys run the mapped command — but only while this menu is the
 * last thing on screen (Terminal tracks that via result.isMenu).
 */
export const MENU = [
    { key: '1', label: 'About',      cmd: 'cat ~/about.txt' },
    { key: '2', label: 'Experience', cmd: 'ls ~/experience' },
    { key: '3', label: 'Projects',   cmd: 'ls ~/projects' },
    { key: '4', label: 'Research',   cmd: 'cat ~/research/catd.md' },
    { key: '5', label: 'Skills',     cmd: 'cat ~/skills.txt' },
    { key: '6', label: 'Contact',    cmd: 'contact' },
    { key: '7', label: 'Resume',     cmd: 'open ~/resume.pdf' },
];

export const getMenuView = () => {
    const rows = MENU
        .map((m) => `  [${m.key}]  ${m.label.padEnd(12)}${m.cmd}`)
        .join('\n');
    return `
Guided tour
${DIVIDER}

${rows}

${DIVIDER}
Press a number to run the command shown, or type any command yourself.
`.replace(/^\n+|\n+$/g, '');
};

/* ─── whoami ─────────────────────────────────────────────────────── */
export const getWhoamiView = () => `agrim — ${common.personal.name}\n${common.personal.tagline}`;

/* ─── neofetch ───────────────────────────────────────────────────── */
export const getNeofetchView = () => {
    const c = common.contact;
    const info = [
        `agrim@portfolio`,
        DIVIDER.slice(0, 28),
        `Role:      ${common.personal.tagline}`,
        `Location:  ${c.location}`,
        `Email:     ${c.email}`,
        `GitHub:    ${c.github}`,
        `Web:       ${c.website}`,
        `Shell:     zsh (portfolio vfs)`,
        `Stack:     React · TypeScript · Python/Django`,
    ];
    const art = [
        '      _____      ',
        '     /     \\     ',
        '    | () () |    ',
        '     \\  ^  /     ',
        '      |||||      ',
        '      |||||      ',
        '                 ',
        '                 ',
        '                 ',
    ];
    return art.map((a, i) => `${a}  ${info[i] || ''}`).join('\n');
};
