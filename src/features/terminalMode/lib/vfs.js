import content from '../../../data/content.json';

/*
 * vfs.js — the terminal's virtual filesystem, built once from content.json.
 *
 * Node shape:
 *   dir  → { type: 'dir',  name, children: { [name]: node } }
 *   file → { type: 'file', name, content }                    (text)
 *          { type: 'file', name, binary: true, href, size }   (binary, openable)
 *
 * Paths are normalized strings: '~', '~/projects', '~/research/catd.md'.
 */

const { common } = content;

// Sentinel line inside contact.txt — the UI swaps this exact line for a
// clickable button that opens the shared contact modal.
export const CONTACT_ACTION = '@@OPEN_CONTACT_FORM@@';

export const HOME = '~';

/* ─── string helpers ─────────────────────────────────────────────── */

const kebab = (s) =>
    String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Simple word-wrap so long lines stay inside the terminal frame.
const wrap = (text, width = 66, indent = '') => {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
        if (line && (line + word).length > width) {
            lines.push(line.trimEnd());
            line = '';
        }
        line += word + ' ';
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines.map((l) => indent + l).join('\n');
};

// Bulleted list with hanging indent.
const bullets = (items, indent = '  ') =>
    items.map((t) => wrap(`• ${t}`, 66, indent)).join('\n');

const linkLines = (links = []) =>
    links.length ? `\nLinks:\n${links.map((l) => `  • ${l.label} → ${l.url}`).join('\n')}` : '';

/* ─── node constructors ──────────────────────────────────────────── */

const file = (name, body) => ({
    type: 'file',
    name,
    content: String(body).replace(/^\n+|\n+$/g, ''),
});

const binary = (name, href, size) => ({ type: 'file', name, binary: true, href, size });

const dir = (name, nodes) => ({
    type: 'dir',
    name,
    children: Object.fromEntries(nodes.map((n) => [n.name, n])),
});

/* ─── file contents (derived from content.json) ──────────────────── */

const aboutTxt = () => `
# ${common.personal.name}
${common.personal.tagline}

${wrap(common.personal.summary)}
`;

const skillsTxt = () => {
    const areas = bullets(common.personal.areasOfExpertise);
    const categories = common.skills.categories
        .map((c) => `${c.name}:\n${bullets(c.items)}`)
        .join('\n\n');
    return `
# Skills

Areas of expertise:
${areas}

${categories}
`;
};

const contactTxt = () => {
    const c = common.contact;
    return `
# Contact

Email:     ${c.email}
Location:  ${c.location}
Website:   ${c.website}
GitHub:    ${c.github}
LinkedIn:  ${c.linkedin}

Prefer to write something right now?

${CONTACT_ACTION}
`;
};

const educationTxt = () => {
    const entries = common.education
        .map((e) => `${e.degree}\n${e.school}\n${e.year}`)
        .join('\n\n');
    return `
# Education

${entries}
`;
};

const experienceMd = (e) => `
# ${e.role}
${e.company}
${e.period}

${bullets(e.description)}${linkLines(e.links)}
`;

const projectMd = (p) => `
# ${p.title}
${p.category}${p.status ? ` · ${p.status}` : ''}

${wrap(p.description)}

Outcome:
${wrap(p.outcome, 66, '  ')}${linkLines(p.links)}
`;

const researchMd = (r) => {
    // Local paper PDFs live next to this file — point readers at `open`.
    const links = (r.links || [])
        .filter((l) => !l.download)
        .map((l) => (l.url.startsWith('/') ? { ...l, url: "run 'open catd-paper.pdf'" } : l));
    return `
# ${r.title}
${r.role} · ${r.period}
Status: ${r.status}

${wrap(r.summary)}

Citation:
${wrap(r.citation, 66, '  ')}

Highlights:
${bullets(r.highlights)}${linkLines(links)}
`;
};

// Research entries: the CATD paper gets its canonical short name.
const researchName = (r, i) => {
    const acronym = r.title.match(/\(([A-Za-z0-9-]+)\)/);
    return `${acronym ? acronym[1].toLowerCase() : kebab(r.title) || `research-${i + 1}`}.md`;
};

/* ─── the filesystem root ────────────────────────────────────────── */

export const ROOT = dir('~', [
    file('about.txt', aboutTxt()),
    file('skills.txt', skillsTxt()),
    file('contact.txt', contactTxt()),
    file('education.txt', educationTxt()),
    binary('resume.pdf', '/AgrimSigdel-Resume.pdf', 76874),
    dir('experience', common.experience.map((e) =>
        file(`${kebab(e.company.split('|')[0])}.md`, experienceMd(e))
    )),
    dir('projects', common.projects.map((p) =>
        file(`${kebab(p.title)}.md`, projectMd(p))
    )),
    dir('research', [
        ...common.research.map((r, i) => file(researchName(r, i), researchMd(r))),
        binary('catd-paper.pdf', '/CATD-Submission.pdf', 530394),
    ]),
]);

/* ─── path resolution ────────────────────────────────────────────── */

/*
 * resolvePath(cwd, input) → normalized path string.
 * Supports: relative paths, '.', '..', '~', leading '/' (treated as '~'),
 * trailing slashes, repeated slashes. Purely lexical — the result may not exist.
 */
export const resolvePath = (cwd, input = '') => {
    const raw = String(input).trim();
    if (raw === '') return cwd || HOME;

    // Absolute paths restart at ~; otherwise start from cwd's segments.
    const segs = raw.startsWith('~') || raw.startsWith('/')
        ? []
        : (cwd || HOME).split('/').slice(1);

    const parts = raw.replace(/^~\/?|^\/+/, '').split('/');
    for (const p of parts) {
        if (!p || p === '.') continue;
        if (p === '..') segs.pop();
        else segs.push(p);
    }
    return HOME + (segs.length ? '/' + segs.join('/') : '');
};

// Walk a normalized path to its node (case-insensitive). Null if missing.
export const getNode = (path) => {
    const segs = path === HOME ? [] : String(path).slice(2).split('/');
    let node = ROOT;
    for (const s of segs) {
        if (!node || node.type !== 'dir') return null;
        node = node.children[s]
            || Object.values(node.children).find((c) => c.name.toLowerCase() === s.toLowerCase())
            || null;
    }
    return node;
};

// Sorted child names of a directory node.
export const childNames = (node) => Object.keys(node?.children || {}).sort();

// Name as shown in listings — directories get a trailing slash.
export const displayName = (node) => (node.type === 'dir' ? `${node.name}/` : node.name);
