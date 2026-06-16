// Portfolio data entity - derived from the single source of truth (content.json).
// Do NOT hardcode portfolio facts here; edit src/data/content.json instead.
import content from "../../../data/content.json";

const { common } = content;

// Map canonical projects to the shape the fun-mode WorkGrid expects.
export const projectsData = common.projects.map((p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  status: p.status || null,
  pitch: p.description,
  outcome: p.outcome,
  links: p.links || [],
  color: p.color || "#111",
}));

// Research entries (CATD framework, publications).
export const researchData = common.research || [];

// Flat skills list for compact displays.
export const skillsData = common.skills.flatList;

// "Method" / process steps - presentation copy, not CV facts, so it lives here.
export const processSteps = [
  {
    id: 1,
    title: "Strategize",
    desc: 'I don\'t start until I know the "Why." Every solution begins with a clear objective and a deep dive into the problem space.',
    icon: "01",
  },
  {
    id: 2,
    title: "Execute",
    desc: "Fast iterations and clean code. I focus on building robust foundations that can scale and adapt.",
    icon: "02",
  },
  {
    id: 3,
    title: "Refine",
    desc: "Because the first draft is just the beginning. Continuous improvement and feedback loops are core to my work.",
    icon: "03",
  },
];
