import React from 'react';
import {
  TextField,
  TextAreaField,
  StringListField,
  LinkListEditor,
  ObjectListEditor,
} from './fields';

/*
 * Per-section editors. Each receives its own subtree (`value`) and an
 * `onChange(nextSubtree)` — ContentEditor wires them to the full tree, so
 * these stay ignorant of dotted paths.
 */

const patchObj = (value, onChange) => (part) => onChange({ ...value, ...part });

/* ------------------------------------------------ common.personal */
export function PersonalSection({ value, onChange }) {
  const patch = patchObj(value, onChange);
  return (
    <section className="admin-card">
      <h2>Personal</h2>
      <TextField label="Name" value={value.name} onChange={(v) => patch({ name: v })} />
      <TextField label="First name" value={value.firstName} onChange={(v) => patch({ firstName: v })} />
      <TextField label="Tagline" value={value.tagline} onChange={(v) => patch({ tagline: v })} />
      <TextField label="Intro" value={value.intro} onChange={(v) => patch({ intro: v })} hint="The hero line — “I build things that work.”" />
      <TextAreaField label="Summary" value={value.summary} onChange={(v) => patch({ summary: v })} rows={5} />
      <TextAreaField label="Short summary" value={value.shortSummary} onChange={(v) => patch({ shortSummary: v })} rows={3} hint="Used for SEO descriptions and compact intros." />
      <StringListField label="Areas of expertise (one per line)" items={value.areasOfExpertise} onChange={(v) => patch({ areasOfExpertise: v })} />
    </section>
  );
}

/* ------------------------------------------------ common.contact */
export function ContactSection({ value, onChange }) {
  const patch = patchObj(value, onChange);
  return (
    <section className="admin-card">
      <h2>Contact</h2>
      <TextField label="Email" value={value.email} onChange={(v) => patch({ email: v })} />
      <TextField label="Location" value={value.location} onChange={(v) => patch({ location: v })} />
      <TextField label="Website (display)" value={value.website} onChange={(v) => patch({ website: v })} hint="Shown without protocol — e.g. agrimsigdel.com.np" />
      <TextField label="GitHub (display)" value={value.github} onChange={(v) => patch({ github: v })} />
      <TextField label="GitHub URL" value={value.githubUrl} onChange={(v) => patch({ githubUrl: v })} />
      <TextField label="LinkedIn (display)" value={value.linkedin} onChange={(v) => patch({ linkedin: v })} />
      <TextField label="LinkedIn URL" value={value.linkedinUrl} onChange={(v) => patch({ linkedinUrl: v })} />
    </section>
  );
}

/* ------------------------------------------------ common.education */
export function EducationSection({ value, onChange }) {
  return (
    <section className="admin-card">
      <h2>Education</h2>
      <ObjectListEditor
        items={value}
        onChange={onChange}
        itemTitle={(e) => e.degree || 'New entry'}
        itemSubtitle={(e) => e.year}
        makeNew={() => ({ degree: '', school: '', year: '' })}
        addLabel="+ Add education"
        renderItem={(item, patch) => (
          <>
            <TextField label="Degree" value={item.degree} onChange={(v) => patch({ degree: v })} />
            <TextField label="School" value={item.school} onChange={(v) => patch({ school: v })} />
            <TextField label="Year(s)" value={item.year} onChange={(v) => patch({ year: v })} placeholder="2022 – 2026" />
          </>
        )}
      />
    </section>
  );
}

/* ------------------------------------------------ common.experience */
export function ExperienceSection({ value, onChange }) {
  return (
    <section className="admin-card">
      <h2>Work experience</h2>
      <ObjectListEditor
        items={value}
        onChange={onChange}
        itemTitle={(e) => e.role || 'New role'}
        itemSubtitle={(e) => [e.company, e.period].filter(Boolean).join(' · ')}
        makeNew={() => ({ role: '', company: '', period: '', description: [], links: [] })}
        addLabel="+ Add experience"
        renderItem={(item, patch) => (
          <>
            <TextField label="Role" value={item.role} onChange={(v) => patch({ role: v })} />
            <TextField label="Company" value={item.company} onChange={(v) => patch({ company: v })} placeholder="Company | Remote" />
            <TextField label="Period" value={item.period} onChange={(v) => patch({ period: v })} placeholder="Apr 2026 – Present" />
            <StringListField label="Bullet points (one per line)" items={item.description} onChange={(v) => patch({ description: v })} />
            <LinkListEditor label="Links" links={item.links} onChange={(v) => patch({ links: v })} />
          </>
        )}
      />
    </section>
  );
}

/* ------------------------------------------------ common.research */
export function ResearchSection({ value, onChange }) {
  return (
    <section className="admin-card">
      <h2>Research &amp; publications</h2>
      <ObjectListEditor
        items={value}
        onChange={onChange}
        itemTitle={(r) => r.title || 'New publication'}
        itemSubtitle={(r) => r.status}
        makeNew={() => ({
          title: '',
          role: '',
          period: '',
          status: '',
          citation: '',
          summary: '',
          highlights: [],
          links: [],
        })}
        addLabel="+ Add research"
        renderItem={(item, patch) => (
          <>
            <TextField label="Title" value={item.title} onChange={(v) => patch({ title: v })} />
            <TextField label="Role" value={item.role} onChange={(v) => patch({ role: v })} placeholder="Lead Researcher & First Author" />
            <TextField label="Period" value={item.period} onChange={(v) => patch({ period: v })} />
            <TextField label="Status" value={item.status} onChange={(v) => patch({ status: v })} placeholder="Submitted for peer review" />
            <TextAreaField label="Citation" value={item.citation} onChange={(v) => patch({ citation: v })} rows={3} />
            <TextAreaField label="Summary" value={item.summary} onChange={(v) => patch({ summary: v })} rows={3} />
            <StringListField label="Highlights (one per line)" items={item.highlights} onChange={(v) => patch({ highlights: v })} />
            <LinkListEditor label="Links" links={item.links} onChange={(v) => patch({ links: v })} withDownloadFlag />
          </>
        )}
      />
    </section>
  );
}

/* ------------------------------------------------ common.skills */
export function SkillsSection({ value, onChange }) {
  const patch = patchObj(value, onChange);
  return (
    <section className="admin-card">
      <h2>Skills</h2>
      <ObjectListEditor
        items={value.categories}
        onChange={(v) => patch({ categories: v })}
        itemTitle={(c) => c.name || 'New category'}
        itemSubtitle={(c) => `${c.items?.length ?? 0} items`}
        makeNew={() => ({ name: '', items: [] })}
        addLabel="+ Add category"
        renderItem={(item, patchItem) => (
          <>
            <TextField label="Category name" value={item.name} onChange={(v) => patchItem({ name: v })} />
            <StringListField label="Skills (one per line)" items={item.items} onChange={(v) => patchItem({ items: v })} />
          </>
        )}
      />
      <StringListField
        label="Flat list (one per line)"
        items={value.flatList}
        onChange={(v) => patch({ flatList: v })}
        hint="Compact skill list used by the ticker and terminal displays."
      />
    </section>
  );
}

/* ------------------------------------------------ funMode */
export function FunModeSection({ value, onChange }) {
  const patchHero = (part) => onChange({ ...value, hero: { ...value.hero, ...part } });
  const patchAbout = (part) => onChange({ ...value, about: { ...value.about, ...part } });
  return (
    <section className="admin-card">
      <h2>Fun mode</h2>
      <h3 className="admin-subhead">Hero</h3>
      <TextField label="Greeting" value={value.hero?.greeting} onChange={(v) => patchHero({ greeting: v })} placeholder="Hi, I'm" />
      <TextField label="Action line" value={value.hero?.action} onChange={(v) => patchHero({ action: v })} placeholder="I build things that work." />
      <StringListField label="Specializations (one per line)" items={value.hero?.specialization} onChange={(v) => patchHero({ specialization: v })} hint="Rendered as “Specializing in X and Y”." />
      <h3 className="admin-subhead">About</h3>
      <TextField label="Title" value={value.about?.title} onChange={(v) => patchAbout({ title: v })} />
      <TextField label="Subtitle" value={value.about?.subtitle} onChange={(v) => patchAbout({ subtitle: v })} />
      <TextField label="Tech-stack title" value={value.about?.techStackTitle} onChange={(v) => patchAbout({ techStackTitle: v })} />
    </section>
  );
}
