// Portfolio data entity - derived from the single source of truth (the content
// store, which is content.json until Supabase hydrates it at runtime).
// Do NOT hardcode portfolio facts here; edit content in the admin / content.json.
import { getContent } from '../../../shared/lib/contentStore';

// Map canonical projects to the shape the fun-mode WorkGrid expects.
// Exposed as a function so it always reflects the *current* content, not a
// snapshot frozen at module load (which would ignore admin edits).
export const getProjectsData = () =>
  getContent().common.projects.map((p) => ({
    id: p.id,
    slug: p.slug || null,
    title: p.title,
    category: p.category,
    status: p.status || null,
    pitch: p.description,
    outcome: p.outcome,
    links: p.links || [],
    color: p.color || '#111',
    caseStudy: p.caseStudy || null,
  }));

// Look up a single project's case study by its URL slug.
export const getProjectBySlug = (slug) =>
  getProjectsData().find((p) => p.slug === slug) || null;

// Research entries (CATD framework, publications).
export const getResearchData = () => getContent().common.research || [];

// Flat skills list for compact displays.
export const getSkillsData = () => getContent().common.skills.flatList;

// "Method" / process steps - presentation copy, not CV facts, so it's static.
export const processSteps = [
  {
    id: 1,
    title: 'Strategize',
    desc: 'I don\'t start until I know the "Why." Every solution begins with a clear objective and a deep dive into the problem space.',
    icon: '01',
  },
  {
    id: 2,
    title: 'Execute',
    desc: 'Fast iterations and clean code. I focus on building robust foundations that can scale and adapt.',
    icon: '02',
  },
  {
    id: 3,
    title: 'Refine',
    desc: 'Because the first draft is just the beginning. Continuous improvement and feedback loops are core to my work.',
    icon: '03',
  },
];
