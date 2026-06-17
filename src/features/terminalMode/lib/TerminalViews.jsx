import content from '../../../data/content.json';
import { COMMANDS } from './CommandParser';

const { common, terminalMode } = content;
const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

// Sentinel line in the contact view. The terminal UI swaps this exact line for a
// clickable button that opens the shared contact modal.
export const CONTACT_ACTION = '@@OPEN_CONTACT_FORM@@';

/*
 * The "filesystem" exposed by `ls` / `cat` / `tree`.
 * key = lookup token (also the bare filename minus extension)
 *   name    = how it appears in `ls`
 *   label   = dimmed description column
 *   section = which view `cat`/`cd` opens
 */
export const FILES = {
  about:      { name: 'about.md',       label: 'professional summary',  section: 'about' },
  research:   { name: 'research.pdf',   label: 'publications',          section: 'research' },
  projects:   { name: 'projects/',      label: 'portfolio of work',     section: 'projects' },
  experience: { name: 'experience.log', label: 'career history',        section: 'experience' },
  skills:     { name: 'skills.json',    label: 'technical toolkit',     section: 'skills' },
  contact:    { name: 'contact.vcf',    label: 'get in touch',          section: 'contact' },
};

// Simple word-wrap so long lines stay inside the terminal frame.
const wrap = (text, width = 66, indent = '    ') => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + word).length > width) {
      lines.push(line.trimEnd());
      line = '';
    }
    line += word + ' ';
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.map((l) => indent + l).join('\n');
};

// Terminal view content generators - all derived from content.json.
export const getWelcomeView = () => `
${terminalMode.welcome.border.replace('{name}', common.personal.name)}

${common.personal.tagline}

Type 'help' for commands, 'ls' to list sections, or a number 1-6 to jump in.

`;

/* ─── Help (Claude-CLI style, generated from the command registry) ─── */
export const getHelpView = () => {
  const GROUP_ORDER = ['Navigation', 'Portfolio', 'System', 'Mode'];
  const grouped = {};
  for (const cmd of COMMANDS) {
    if (!cmd.group) continue; // hidden commands (e.g. sudo)
    (grouped[cmd.group] ||= []).push(cmd);
  }

  // Build the "name <args>" usage column and pad everything to align descriptions.
  const usage = (c) => `${c.name}${c.args ? ' ' + c.args : ''}`;
  const pad = Math.max(
    ...COMMANDS.filter((c) => c.group).map((c) => usage(c).length)
  ) + 4;

  const body = GROUP_ORDER
    .filter((g) => grouped[g])
    .map((g) => {
      const rows = grouped[g]
        .map((c) => `  ${usage(c).padEnd(pad)}${c.description}`)
        .join('\n');
      return `${g}\n${rows}`;
    })
    .join('\n\n');

  return `
Agrim's Portfolio Terminal — interactive CV

Usage:  <command> [args]    ·    type a section name or its number (1-6)

${body}

${DIVIDER}
Tips:  Tab to autocomplete  ·  ↑ ↓ for history  ·  Ctrl+L to clear  ·  'man <cmd>' for details

`;
};

/* ─── Tree view of the fake filesystem ───────────────────────────── */
export const getTreeView = () => {
  const entries = Object.values(FILES);
  const lines = entries
    .map((f, i) => `${i === entries.length - 1 ? '└──' : '├──'} ${f.name}`)
    .join('\n');
  return `
~/portfolio
${lines}

${entries.length} entries — type 'cat <file>' to read one.

`;
};

/* ─── man <command> ──────────────────────────────────────────────── */
export const getManView = (cmd) => `
NAME
    ${cmd.name} — ${cmd.description}

SYNOPSIS
    ${cmd.name}${cmd.args ? ' ' + cmd.args : ''}

${cmd.aliases.length ? `ALIASES\n    ${cmd.aliases.join(', ')}\n` : ''}
Type 'help' for the full command list.

`;

/* ─── neofetch / whoami ──────────────────────────────────────────── */
export const getNeofetchView = ({ short = false } = {}) => {
  const c = common.contact;
  const info = [
    `${common.personal.name}@portfolio`,
    DIVIDER.slice(0, 28),
    `Role:      ${common.personal.tagline}`,
    `Location:  ${c.location}`,
    `Email:     ${c.email}`,
    `GitHub:    ${c.github}`,
    `Web:       ${c.website}`,
    `Shell:     zsh · WORK MODE`,
    `Stack:     React · TypeScript · Python/Django`,
  ];
  if (short) {
    return `\nagrim\n${wrap(common.personal.shortSummary, 60, '')}\n`;
  }
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
  const rows = art.map((a, i) => `${a}  ${info[i] || ''}`).join('\n');
  return `\n${rows}\n`;
};

export const getMenuView = () => `
Main Menu:
${DIVIDER}

  [1] About Me          Professional summary and education
  [2] Research          Publications and the CATD framework
  [3] Projects          Portfolio of work and achievements
  [4] Experience        Career history and roles
  [5] Skills            Technical toolkit and expertise
  [6] Contact           Get in touch

${DIVIDER}

Type the number or section name to navigate.
Example: '1' or 'about'

`;

export const getAboutView = () => `
[1] ABOUT ME
${DIVIDER}

Professional Summary:
${wrap(common.personal.summary, 66, '')}

${DIVIDER}

Education:
  ${common.education[0].degree}
  ${common.education[0].school}
  ${common.education[0].year}

${DIVIDER}

Type 'menu' to return to main menu.

`;

export const getResearchView = () => {
  const blocks = common.research
    .map((r) => {
      const highlights = r.highlights.map((h) => `  • ${h}`).join('\n');
      return `${r.title} - ${r.role}  (${r.period})
Status: ${r.status}

${wrap(r.citation, 66, '')}

${highlights}`;
    })
    .join(`\n\n${DIVIDER}\n\n`);

  return `
[2] RESEARCH & PUBLICATIONS
${DIVIDER}

${blocks}

${DIVIDER}

Type 'menu' to return to main menu.

`;
};

export const getProjectsView = () => {
  const blocks = common.projects
    .map((p, i) => {
      const links = (p.links || []).length
        ? `\n    Links: ${p.links.map((l) => `${l.label} → ${l.url}`).join('  |  ')}`
        : '';
      return `[${i + 1}] ${p.title}
    Category: ${p.category}

${wrap(p.description)}

    Outcome:
${wrap(p.outcome)}${links}`;
    })
    .join(`\n\n${DIVIDER}\n\n`);

  return `
[3] PROJECTS
${DIVIDER}

${blocks}

${DIVIDER}

Type 'menu' to return to main menu.

`;
};

export const getExperienceView = () => {
  const blocks = common.experience
    .map((e) => {
      const bullets = e.description.map((d) => wrap(`• ${d}`, 66, '  ')).join('\n');
      const links = (e.links || []).length
        ? `\n\n  Links: ${e.links.map((l) => l.url).join('  |  ')}`
        : '';
      return `${e.role}
${e.company}
${e.period}

${bullets}${links}`;
    })
    .join(`\n\n${DIVIDER}\n\n`);

  return `
[4] EXPERIENCE
${DIVIDER}

${blocks}

${DIVIDER}

Type 'menu' to return to main menu.

`;
};

export const getSkillsView = () => {
  const blocks = common.skills.categories
    .map((c) => {
      const items = c.items.map((i) => `  • ${i}`).join('\n');
      return `${c.name}:\n${items}`;
    })
    .join(`\n\n${DIVIDER}\n\n`);

  return `
[5] SKILLS
${DIVIDER}

${blocks}

${DIVIDER}

Type 'menu' to return to main menu.

`;
};

export const getContactView = () => {
  const c = common.contact;
  return `
[6] CONTACT
${DIVIDER}

Let's connect! I'm always open to discussing new projects,
research, or opportunities to be part of your vision.

Email:     ${c.email}
Location:  ${c.location}

GitHub:    ${c.github}
LinkedIn:  ${c.linkedin}
Portfolio: ${c.website}

${DIVIDER}

Prefer to write something now? Open the message form:

${CONTACT_ACTION}

Type 'menu' to return to main menu.

`;
};
