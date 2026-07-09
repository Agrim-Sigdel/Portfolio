import content from '../../data/content.json';

/*
 * generateResumePdf — builds a resume PDF from content.json (the single source
 * of truth the CV page renders from) so the export always matches the live site.
 *
 * jsPDF is imported dynamically so it only loads when the visitor actually
 * exports — it never touches the initial bundle.
 */

// A4 in mm.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PT_TO_MM = 0.352778;

const DARK = [26, 26, 26];
const MUTED = [110, 110, 110];
const ACCENT = [163, 74, 38]; // matches the CV's warm accent
const RULE = [210, 205, 196];

/* Two-digit zero pad. */
const pad = (n) => String(n).padStart(2, '0');

/*
 * jsPDF's built-in Helvetica uses WinAnsi encoding, which has no glyph for a
 * few symbols the content uses (notably the → arrow). Swap those for ASCII
 * equivalents so nothing renders as tofu.
 */
const clean = (str) =>
  String(str)
    .replace(/→/g, '->') // →
    .replace(/−/g, '-'); // − (minus sign)

/* "Agrim Sigdel Resume 2026-07-09-1430" — timestamped at export time. */
export const timestampedName = (name, date = new Date()) => {
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${name} ${stamp}.pdf`;
};

export async function generateResumePdf() {
  const { jsPDF } = await import('jspdf');
  const { common } = content;
  const { personal, contact, education, experience, research, projects, skills } = common;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const lineHeight = (size, factor = 1.32) => size * PT_TO_MM * factor;

  const ensure = (needed) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Flow a block of text, wrapping to the content width and paginating.
  const write = (
    str,
    { size = 9.5, style = 'normal', color = DARK, indent = 0, hang = 0, gapAfter = 0, factor = 1.32 } = {}
  ) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(clean(str), CONTENT_W - indent);
    const lh = lineHeight(size, factor);
    lines.forEach((line, i) => {
      ensure(lh);
      doc.text(line, MARGIN + indent + (i === 0 ? 0 : hang), y);
      y += lh;
    });
    y += gapAfter;
  };

  // Bulleted list with a hanging indent so wrapped lines align past the dot.
  const bullets = (items) => {
    items.forEach((item) => {
      write(`•  ${item}`, { size: 9.5, indent: 0, hang: 3.4, gapAfter: 0.6 });
    });
  };

  const section = (title) => {
    y += 3.5;
    ensure(9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 1.6;
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4.2;
  };

  // Role/title on the left, period on the right, on the same baseline.
  const entryHead = (leftRaw, rightRaw) => {
    const left = clean(leftRaw);
    const right = rightRaw ? clean(rightRaw) : rightRaw;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const rightW = right ? doc.getTextWidth(right) : 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const rightTextW = right ? doc.getTextWidth(right) : 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const leftLines = doc.splitTextToSize(left, CONTENT_W - rightTextW - 4);
    ensure(lineHeight(10) + 1);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(leftLines[0], MARGIN, y);
    if (right) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(right, PAGE_W - MARGIN - rightTextW, y);
    }
    y += lineHeight(10);
    // Remaining wrapped title lines (long research titles).
    for (let i = 1; i < leftLines.length; i++) {
      ensure(lineHeight(10));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      doc.text(leftLines[i], MARGIN, y);
      y += lineHeight(10);
    }
    void rightW;
  };

  /* ---------- Header ---------- */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  ensure(10);
  doc.text(personal.name, MARGIN, y);
  y += lineHeight(21, 1.1);

  write(personal.tagline, { size: 11, color: MUTED, gapAfter: 1.4 });

  const contactLine = [contact.location, contact.email, contact.website, contact.github]
    .filter(Boolean)
    .join('   ·   ');
  write(contactLine, { size: 8.8, color: MUTED, gapAfter: 0.5 });

  /* ---------- Professional Summary ---------- */
  section('Professional Summary');
  write(personal.summary, { size: 9.5, gapAfter: 0.5 });

  /* ---------- Technical Skills ---------- */
  section('Technical Skills');
  skills.categories.forEach((cat) => {
    ensure(lineHeight(9.5) + 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    const label = `${cat.name}: `;
    const labelW = doc.getTextWidth(label);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    const items = doc.splitTextToSize(clean(cat.items.join(', ')), CONTENT_W - labelW);
    items.forEach((line, i) => {
      if (i > 0) {
        y += lineHeight(9.5);
        ensure(lineHeight(9.5));
      }
      doc.text(line, MARGIN + (i === 0 ? labelW : 0), y);
    });
    y += lineHeight(9.5) + 0.8;
  });

  /* ---------- Work Experience ---------- */
  section('Work Experience');
  experience.forEach((exp) => {
    entryHead(exp.role, exp.period);
    write(exp.company, { size: 9, style: 'italic', color: MUTED, gapAfter: 1 });
    bullets(exp.description);
    y += 1.6;
  });

  /* ---------- Research & Publications ---------- */
  if (research && research.length) {
    section('Research & Publications');
    research.forEach((r) => {
      entryHead(r.title, r.status);
      write(`${r.role} · ${r.period}`, { size: 9, style: 'italic', color: MUTED, gapAfter: 1 });
      if (r.citation) write(r.citation, { size: 8.6, color: MUTED, gapAfter: 1 });
      bullets(r.highlights);
      y += 1.6;
    });
  }

  /* ---------- Projects & Open Source ---------- */
  section('Projects & Open Source');
  projects.forEach((proj) => {
    entryHead(
      proj.status ? `${proj.title}  (${proj.status})` : proj.title,
      proj.category
    );
    bullets([proj.description, proj.outcome]);
    y += 1.6;
  });

  /* ---------- Education ---------- */
  section('Education');
  education.forEach((edu) => {
    entryHead(edu.degree, edu.year);
    write(edu.school, { size: 9, color: MUTED, gapAfter: 1 });
  });

  return {
    blob: doc.output('blob'),
    filename: timestampedName('Agrim Sigdel Resume'),
  };
}
