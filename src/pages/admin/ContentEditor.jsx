import React, { useEffect, useState } from 'react';
import { loadContent, publishContent } from './adminContent';
import { getPath, setPath, downloadJson } from './adminUtils';
import { validateContent } from './validate';
import {
  PersonalSection,
  ContactSection,
  EducationSection,
  ExperienceSection,
  ResearchSection,
  SkillsSection,
  FunModeSection,
} from './SectionEditors';
import ProjectsEditor from './ProjectsEditor';
import MediaManager from './MediaManager';

/*
 * ContentEditor: the Content tab inside AdminShell — a sidebar of sections
 * over one shared draft tree, with Publish/Export in a slim sticky bar.
 *
 * Every section edits its own subtree through structured form components —
 * no raw JSON anywhere. Only the sections that CV mode / fun mode / shared
 * `common` content use are exposed; `terminalMode` (code-driven by design)
 * rides through publish byte-identical.
 *
 * "Export JSON" downloads the current tree so src/data/content.json — the
 * offline/first-paint fallback — can be refreshed and committed when content
 * drifts far from the seed.
 */

// path-based sections share a tiny wrapper contract: value + onChange(subtree)
const SECTIONS = [
  { key: 'personal', label: 'Personal', path: 'common.personal', Component: PersonalSection },
  { key: 'contact', label: 'Contact', path: 'common.contact', Component: ContactSection },
  { key: 'education', label: 'Education', path: 'common.education', Component: EducationSection },
  { key: 'experience', label: 'Experience', path: 'common.experience', Component: ExperienceSection },
  { key: 'research', label: 'Research', path: 'common.research', Component: ResearchSection },
  { key: 'projects', label: 'Projects', path: 'common.projects', Component: ProjectsEditor },
  { key: 'skills', label: 'Skills', path: 'common.skills', Component: SkillsSection },
  { key: 'funMode', label: 'Fun mode', path: 'funMode', Component: FunModeSection },
  { key: 'cv', label: 'CV file', path: null }, // MediaManager: writes common.media.cvUrl
];

export default function ContentEditor() {
  const [content, setContent] = useState(null);
  const [active, setActive] = useState('personal');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const [errors, setErrors] = useState([]);
  const [mediaBusy, setMediaBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let c = await loadContent();
        // Older rows predate common.media — normalize additively so the CV
        // slot has somewhere to write. Nothing else is touched.
        if (!c.common.media) c = setPath(c, 'common.media', {});
        setContent(c);
      } catch (e) {
        setStatus({ type: 'error', msg: `Load failed: ${e.message}` });
      }
    })();
  }, []);

  const setField = (path, value) => {
    setContent((c) => setPath(c, path, value));
    setDirty(true);
    setErrors([]);
    setStatus({ type: 'idle', msg: '' });
  };

  const onPublish = async () => {
    const problems = validateContent(content);
    if (problems.length) {
      setErrors(problems);
      setStatus({ type: 'error', msg: `${problems.length} issue${problems.length > 1 ? 's' : ''} to fix` });
      return;
    }
    setStatus({ type: 'busy', msg: 'Publishing…' });
    try {
      await publishContent(content);
      setDirty(false);
      setStatus({ type: 'ok', msg: 'Published — the live site now shows these changes.' });
    } catch (e) {
      setStatus({ type: 'error', msg: `Publish failed: ${e.message}` });
    }
  };

  const publishing = status.type === 'busy';

  if (!content) {
    return (
      <div className="admin-card">
        {status.type === 'error' ? (
          <p className="admin-error" role="alert">{status.msg}</p>
        ) : (
          <span className="db-spin admin-spin" />
        )}
      </div>
    );
  }

  const renderSection = () => {
    if (active === 'cv') {
      return <MediaManager content={content} setField={setField} onBusy={setMediaBusy} />;
    }
    const { path, Component } = SECTIONS.find((s) => s.key === active);
    return <Component value={getPath(content, path)} onChange={(v) => setField(path, v)} />;
  };

  return (
    <div className="admin-editor-panel">
      <div className="admin-editorbar">
        {status.msg && <span className={`admin-status admin-status-${status.type}`}>{status.msg}</span>}
        {dirty && !publishing && <span className="admin-status admin-status-dirty">Unsaved changes</span>}
        <button
          className="admin-btn"
          onClick={() => downloadJson(content, 'content.json')}
          title="Download the current tree — save over src/data/content.json and commit to refresh the offline fallback."
        >
          Export JSON
        </button>
        <button
          className="admin-btn admin-btn-primary"
          onClick={onPublish}
          disabled={publishing || !dirty || mediaBusy}
        >
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="admin-error-list" role="alert">
          <strong>Fix before publishing:</strong>
          <ul>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="admin-layout">
        <nav className="admin-sidebar" aria-label="Content sections">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`admin-nav-btn${active === s.key ? ' active' : ''}`}
              onClick={() => setActive(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <div className="admin-section">{renderSection()}</div>
      </div>
    </div>
  );
}
