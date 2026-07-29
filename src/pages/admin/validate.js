/*
 * Publish-time validation. Returns a list of human-readable problems (empty =
 * OK). Focused on what actually breaks the site: slugs map to routes, ids are
 * React keys, and empty required fields render as blank UI.
 */

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const checkLinks = (links, where, errors) => {
  (links ?? []).forEach((l, i) => {
    if (l.label && !l.url) errors.push(`${where}: link #${i + 1} "${l.label}" has no URL.`);
  });
};

/*
 * Showcase media. A URL-less entry renders as a broken box, so it blocks
 * publishing. Missing alt text on an image doesn't break anything visually but
 * makes the page unreadable to a screen reader, so it blocks too — it is one
 * field, and the alternative is that it never gets filled in.
 */
const checkMedia = (media, where, errors) => {
  (media ?? []).forEach((m, i) => {
    const at = `${where}: media #${i + 1}`;
    if (!m?.url?.trim()) errors.push(`${at} has no URL — upload a file or remove the entry.`);
    else if (m.type !== 'video' && !m.alt?.trim()) {
      errors.push(`${at} is an image with no alt text — describe it for screen readers.`);
    }
  });
};

export function validateContent(content) {
  const errors = [];
  const { experience = [], education = [], research = [], projects = [], skills } = content.common ?? {};

  projects.forEach((p, i) => {
    const label = `Projects → #${i + 1}${p.title ? ` "${p.title}"` : ''}`;
    if (!p.title?.trim()) errors.push(`${label}: title is required.`);
    if (!p.slug) errors.push(`${label}: slug is required (it becomes the /work/… URL).`);
    else if (!SLUG_RE.test(p.slug)) errors.push(`${label}: slug "${p.slug}" must be lowercase letters/numbers separated by dashes.`);
    if (!Number.isInteger(p.id)) errors.push(`${label}: id must be an integer.`);
    checkLinks(p.links, label, errors);
    checkMedia(p.caseStudy?.media, `${label} → gallery`, errors);
    (p.caseStudy?.sections ?? []).forEach((s, si) => {
      if (!s.heading?.trim()) errors.push(`${label}: case-study section #${si + 1} has no heading.`);
      checkMedia(s.media, `${label} → section "${s.heading || si + 1}"`, errors);
    });
  });

  // duplicates across projects
  const seenSlugs = new Map();
  const seenIds = new Map();
  projects.forEach((p, i) => {
    if (p.slug) {
      if (seenSlugs.has(p.slug)) errors.push(`Projects → #${i + 1} "${p.title}": duplicate slug "${p.slug}" (also used by #${seenSlugs.get(p.slug) + 1}).`);
      else seenSlugs.set(p.slug, i);
    }
    if (Number.isInteger(p.id)) {
      if (seenIds.has(p.id)) errors.push(`Projects → #${i + 1} "${p.title}": duplicate id ${p.id} (also used by #${seenIds.get(p.id) + 1}).`);
      else seenIds.set(p.id, i);
    }
  });

  experience.forEach((e, i) => {
    const label = `Experience → #${i + 1}${e.role ? ` "${e.role}"` : ''}`;
    if (!e.role?.trim()) errors.push(`${label}: role is required.`);
    if (!e.company?.trim()) errors.push(`${label}: company is required.`);
    checkLinks(e.links, label, errors);
  });

  education.forEach((e, i) => {
    if (!e.degree?.trim()) errors.push(`Education → #${i + 1}: degree is required.`);
  });

  research.forEach((r, i) => {
    const label = `Research → #${i + 1}${r.title ? ` "${r.title}"` : ''}`;
    if (!r.title?.trim()) errors.push(`${label}: title is required.`);
    checkLinks(r.links, label, errors);
  });

  (skills?.categories ?? []).forEach((c, i) => {
    if (!c.name?.trim()) errors.push(`Skills → category #${i + 1}: name is required.`);
  });

  return errors;
}
