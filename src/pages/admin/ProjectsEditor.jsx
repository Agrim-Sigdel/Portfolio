import React from 'react';
import {
  TextField,
  TextAreaField,
  CheckboxField,
  StringListField,
  LinkListEditor,
  ObjectListEditor,
  MediaListEditor,
} from './fields';
import { slugify } from './adminUtils';

/*
 * Projects editor — the deepest section: each project carries a nested
 * caseStudy (stack, highlights, showcase media, prose sections) that renders
 * at /work/:slug.
 *
 * Slug behaviour: typing a title auto-fills the slug while the slug is still
 * "following" the title (empty, or equal to slugify(previous title)). Once
 * edited by hand it stops following. Slugs map to routes, so validation blocks
 * publishing empty/duplicate ones (see validate.js).
 *
 * Media lives at two levels on purpose: a gallery on the case study (the
 * project's showcase, shown up top) and an optional list per section (a
 * screenshot next to the prose it illustrates). Uploads name themselves after
 * the slug, so renaming a project doesn't move files that are already live.
 */

const emptyCaseStudy = () => ({
  tagline: '',
  role: '',
  stack: [],
  highlights: [],
  media: [],
  sections: [],
});

export default function ProjectsEditor({ value, onChange, onBusy }) {
  const projects = Array.isArray(value) ? value : [];

  const makeNew = () => ({
    id: Math.max(0, ...projects.map((p) => (Number.isInteger(p.id) ? p.id : 0))) + 1,
    slug: '',
    title: '',
    category: '',
    description: '',
    outcome: '',
    color: '#141414',
    links: [],
    caseStudy: emptyCaseStudy(),
  });

  return (
    <section className="admin-card">
      <h2>Projects &amp; case studies</h2>
      <ObjectListEditor
        items={projects}
        onChange={onChange}
        itemTitle={(p) => p.title || 'New project'}
        itemSubtitle={(p) => p.slug && `/work/${p.slug}`}
        makeNew={makeNew}
        addLabel="+ Add project"
        renderItem={(item, patch, i) => {
          const cs = item.caseStudy ?? emptyCaseStudy();
          const patchCs = (part) => patch({ caseStudy: { ...cs, ...part } });
          const slugTaken = projects.some((p, pi) => pi !== i && p.slug === item.slug && item.slug);

          return (
            <>
              <TextField
                label="Title"
                value={item.title}
                onChange={(v) => {
                  // Auto-slug only while the slug still follows the title.
                  const following = !item.slug || item.slug === slugify(item.title);
                  patch(following ? { title: v, slug: slugify(v) } : { title: v });
                }}
              />
              <TextField
                label="Slug"
                value={item.slug}
                onChange={(v) => patch({ slug: slugify(v) || v })}
                hint={
                  slugTaken
                    ? '⚠ This slug is already used by another project.'
                    : !item.slug
                      ? '⚠ Required — becomes the case-study URL (/work/…).'
                      : `Case study lives at /work/${item.slug}. Changing it breaks old links.`
                }
              />
              <TextField label="Category" value={item.category} onChange={(v) => patch({ category: v })} placeholder="Full-Stack · Web Platform" />
              {/* Empty status is falsy, so the pill simply doesn't render. */}
              <TextField
                label="Status badge (optional)"
                value={item.status}
                onChange={(v) => patch({ status: v })}
                placeholder="In development"
              />
              <TextAreaField label="Description" value={item.description} onChange={(v) => patch({ description: v })} rows={3} />
              <TextAreaField label="Outcome" value={item.outcome} onChange={(v) => patch({ outcome: v })} rows={2} />
              <label className="admin-field">
                <span>Card color</span>
                <span className="admin-color-row">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(item.color ?? '') ? item.color : '#141414'}
                    onChange={(e) => patch({ color: e.target.value })}
                  />
                  <input
                    type="text"
                    value={item.color ?? ''}
                    placeholder="#141414"
                    onChange={(e) => patch({ color: e.target.value })}
                  />
                </span>
              </label>
              <LinkListEditor label="Links" links={item.links} onChange={(v) => patch({ links: v })} />

              <h3 className="admin-subhead">Case study (/work/{item.slug || '…'})</h3>
              <TextField label="Tagline" value={cs.tagline} onChange={(v) => patchCs({ tagline: v })} />
              <TextField label="Role" value={cs.role} onChange={(v) => patchCs({ role: v })} />
              {/* The banner shows unless wip is explicitly false, so an untouched
                  or newly added case study is a draft by default. */}
              <CheckboxField
                label="Show the “work in progress” banner"
                checked={cs.wip !== false}
                onChange={(on) => patchCs({ wip: on ? true : false })}
                hint="On = readers are told the write-up is still being drafted. Turn off once it's finished."
              />
              <StringListField label="Stack (one per line)" items={cs.stack} onChange={(v) => patchCs({ stack: v })} />
              <StringListField label="Highlights (one per line)" items={cs.highlights} onChange={(v) => patchCs({ highlights: v })} />

              <MediaListEditor
                label="Showcase gallery"
                items={cs.media}
                onChange={(v) => patchCs({ media: v })}
                slug={item.slug}
                onBusy={onBusy}
                hint="Screenshots and demo clips for this project, shown near the top of the case study. The first image also becomes the social share card."
              />

              <div className="admin-field">
                <span>Sections</span>
                <ObjectListEditor
                  items={cs.sections}
                  onChange={(v) => patchCs({ sections: v })}
                  itemTitle={(s) => s.heading || 'New section'}
                  makeNew={() => ({ heading: '', body: '', bullets: [], media: [] })}
                  addLabel="+ Add section"
                  renderItem={(sec, patchSec) => (
                    <>
                      <TextField label="Heading" value={sec.heading} onChange={(v) => patchSec({ heading: v })} />
                      <TextAreaField label="Body" value={sec.body} onChange={(v) => patchSec({ body: v })} rows={5} />
                      <StringListField
                        label="Bullets (one per line)"
                        items={sec.bullets}
                        onChange={(v) => patchSec({ bullets: v })}
                        hint="Optional list rendered under the body — good for decisions, features or trade-offs."
                      />
                      <MediaListEditor
                        label="Section media"
                        items={sec.media}
                        onChange={(v) => patchSec({ media: v })}
                        slug={item.slug}
                        onBusy={onBusy}
                        hint="Optional — a screenshot or clip shown with this section."
                      />
                    </>
                  )}
                />
              </div>
            </>
          );
        }}
      />
    </section>
  );
}
