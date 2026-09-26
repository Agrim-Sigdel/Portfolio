import React, { useRef, useState } from 'react';
import { moveItem } from './adminUtils';
import {
  uploadMedia,
  caseStudyAssetPath,
  isVideoFile,
  LARGE_ASSET_BYTES,
} from './adminMedia';

/*
 * Generic controlled field components for the admin editor.
 *
 * Section editors compose these instead of hand-rolling markup, so every list
 * gets the same add/remove/reorder/collapse behaviour for free. All of them
 * follow the `.admin-field` styling conventions from admin.css.
 */

export function TextField({ label, value, onChange, placeholder, hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <em className="admin-hint">{hint}</em>}
    </label>
  );
}

export function CheckboxField({ label, checked, onChange, hint }) {
  return (
    <div className="admin-field">
      <label className="admin-check admin-check-block">
        <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
      {hint && <em className="admin-hint">{hint}</em>}
    </div>
  );
}

export function TextAreaField({ label, value, onChange, rows = 4, hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      {hint && <em className="admin-hint">{hint}</em>}
    </label>
  );
}

/*
 * string[] edited as a one-item-per-line textarea. Blank lines are kept while
 * typing (so Enter works naturally) except a single trailing one; consumers get
 * trimmed-end lines.
 */
export function StringListField({ label, items, onChange, rows, hint }) {
  const value = Array.isArray(items) ? items.join('\n') : '';
  const handle = (text) =>
    onChange(
      text
        .split('\n')
        .map((l) => l.trimEnd())
        .filter((l, i, a) => !(l === '' && i === a.length - 1))
    );
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea
        rows={rows ?? Math.max(3, (Array.isArray(items) ? items.length : 0) + 1)}
        value={value}
        onChange={(e) => handle(e.target.value)}
      />
      {hint && <em className="admin-hint">{hint}</em>}
    </label>
  );
}

/*
 * [{label, url, download?}] editor. `withDownloadFlag` adds the checkbox used
 * by research links (renders the link as a DownloadButton on the CV page).
 */
export function LinkListEditor({ label, links, onChange, withDownloadFlag = false }) {
  const list = Array.isArray(links) ? links : [];

  const patch = (i, part) => onChange(list.map((l, li) => (li === i ? { ...l, ...part } : l)));
  const remove = (i) => {
    const name = list[i]?.label || list[i]?.url || 'this link';
    if (window.confirm(`Remove ${name}?`)) onChange(list.filter((_, li) => li !== i));
  };

  return (
    <div className="admin-field">
      <span>{label}</span>
      {list.map((link, i) => (
        <div className="admin-row" key={i}>
          <input
            type="text"
            placeholder="Label"
            value={link.label ?? ''}
            onChange={(e) => patch(i, { label: e.target.value })}
          />
          <input
            type="text"
            className="admin-row-grow"
            placeholder="https://…"
            value={link.url ?? ''}
            onChange={(e) => patch(i, { url: e.target.value })}
          />
          {withDownloadFlag && (
            <label className="admin-check" title="Serve as a file download instead of a page link">
              <input
                type="checkbox"
                checked={Boolean(link.download)}
                onChange={(e) => {
                  // keep the JSON tidy: only store the flag when it's on
                  const { download: _drop, ...rest } = link;
                  onChange(
                    list.map((l, li) =>
                      li === i ? (e.target.checked ? { ...rest, download: true } : rest) : l
                    )
                  );
                }}
              />
              dl
            </label>
          )}
          <button type="button" className="admin-btn admin-btn-sm" title="Move up" disabled={i === 0} onClick={() => onChange(moveItem(list, i, i - 1))}>↑</button>
          <button type="button" className="admin-btn admin-btn-sm" title="Move down" disabled={i === list.length - 1} onClick={() => onChange(moveItem(list, i, i + 1))}>↓</button>
          <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" title="Remove" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button
        type="button"
        className="admin-btn admin-btn-sm"
        onClick={() => onChange([...list, { label: '', url: '' }])}
      >
        + Add link
      </button>
    </div>
  );
}

/*
 * Showcase media editor — [{type, url, alt, caption, poster?}].
 *
 * Two ways in: upload a file (straight to the public `media` bucket, named
 * cs-<slug>-<timestamp>-<file>) or paste a URL for something already hosted.
 * `type` is detected from the file's MIME type on upload and stays editable,
 * because a pasted URL can't be sniffed.
 *
 * Alt text is prompted for rather than optional: these render as <img> on a
 * public page, and a screenshot with no alt is invisible to a screen reader.
 * Videos are muted + loop + playsInline by default (see CaseStudyPage) so they
 * behave like a silent demo clip, which is what a project showcase wants.
 */
export function MediaListEditor({ label, items, onChange, slug, onBusy, hint }) {
  const list = Array.isArray(items) ? items : [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const patch = (i, part) => onChange(list.map((m, mi) => (mi === i ? { ...m, ...part } : m)));

  const remove = (i) => {
    // Only the reference is dropped — the file stays in the bucket, so a
    // mis-click is recoverable from the Media tab.
    if (window.confirm('Remove this item from the case study? (The uploaded file stays in Media.)')) {
      onChange(list.filter((_, mi) => mi !== i));
    }
  };

  const working = (on) => {
    setBusy(on);
    onBusy?.(on);
  };

  const onPick = async (files) => {
    const picked = Array.from(files ?? []);
    if (!picked.length) return;
    working(true);
    setError('');
    try {
      const added = [];
      for (const file of picked) {
        const url = await uploadMedia(file, caseStudyAssetPath(slug, file));
        added.push({
          type: isVideoFile(file) ? 'video' : 'image',
          url,
          alt: '',
          caption: '',
        });
      }
      onChange([...list, ...added]);
      const heavy = picked.filter((f) => f.size > LARGE_ASSET_BYTES);
      if (heavy.length) {
        setError(
          `Uploaded, but ${heavy.length} file${heavy.length > 1 ? 's are' : ' is'} over 8 MB — ` +
            'these are served straight from storage, so compress before publishing.'
        );
      }
    } catch (e) {
      console.error('Media upload error:', e);
      setError(`Upload failed: ${e.message}`);
    } finally {
      working(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="admin-field">
      <span>{label}</span>
      {hint && <em className="admin-hint">{hint}</em>}

      {list.map((m, i) => {
        const isVideo = m.type === 'video';
        return (
          <div className="admin-media-item" key={i}>
            <div className="admin-media-thumb">
              {m.url ? (
                isVideo ? (
                  <video src={m.url} muted playsInline preload="metadata" />
                ) : (
                  <img src={m.url} alt={m.alt || ''} loading="lazy" />
                )
              ) : (
                <span className="admin-muted">no URL</span>
              )}
            </div>

            <div className="admin-media-fields">
              <div className="admin-row">
                <select
                  value={isVideo ? 'video' : 'image'}
                  onChange={(e) => patch(i, { type: e.target.value })}
                  aria-label="Media type"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <input
                  type="text"
                  className="admin-row-grow"
                  placeholder="https://… (or upload below)"
                  value={m.url ?? ''}
                  onChange={(e) => patch(i, { url: e.target.value })}
                />
                <button type="button" className="admin-btn admin-btn-sm" title="Move up" disabled={i === 0} onClick={() => onChange(moveItem(list, i, i - 1))}>↑</button>
                <button type="button" className="admin-btn admin-btn-sm" title="Move down" disabled={i === list.length - 1} onClick={() => onChange(moveItem(list, i, i + 1))}>↓</button>
                <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" title="Remove" onClick={() => remove(i)}>✕</button>
              </div>

              <input
                type="text"
                placeholder={isVideo ? 'Description (for screen readers)' : 'Alt text — describe the screenshot'}
                value={m.alt ?? ''}
                onChange={(e) => patch(i, { alt: e.target.value })}
              />
              <input
                type="text"
                placeholder="Caption (optional — shown under the media)"
                value={m.caption ?? ''}
                onChange={(e) => patch(i, { caption: e.target.value })}
              />
              {isVideo && (
                <input
                  type="text"
                  placeholder="Poster image URL (optional — first frame shown before play)"
                  value={m.poster ?? ''}
                  onChange={(e) => patch(i, { poster: e.target.value })}
                />
              )}
              {!m.alt && (
                <em className="admin-hint">⚠ No alt text — add one so this is described to screen readers.</em>
              )}
            </div>
          </div>
        );
      })}

      <div className="admin-actions">
        <label className={`admin-btn admin-btn-sm${busy ? ' admin-btn-disabled' : ''}`}>
          {busy ? 'Uploading…' : '+ Upload image / video'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            disabled={busy}
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
        <button
          type="button"
          className="admin-btn admin-btn-sm"
          disabled={busy}
          onClick={() => onChange([...list, { type: 'image', url: '', alt: '', caption: '' }])}
        >
          + Add by URL
        </button>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </div>
  );
}

/*
 * Array-of-objects editor: one collapsible card per item with move/delete
 * controls, plus an Add button. The section supplies:
 *   itemTitle(item, i) -> card header text
 *   itemSubtitle(item) -> optional muted text next to the title
 *   makeNew()          -> default object for Add (new items start expanded)
 *   renderItem(item, patch, i) -> the card body; patch(partial) merges fields
 */
export function ObjectListEditor({
  items,
  onChange,
  itemTitle,
  itemSubtitle,
  makeNew,
  renderItem,
  addLabel = '+ Add',
}) {
  const list = Array.isArray(items) ? items : [];
  const [open, setOpen] = useState(() => new Set());

  const toggle = (i) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // Reordering/removal shifts indices; simplest correct behaviour is to keep
  // the open-set keyed by index and remap it alongside the move.
  const move = (i, dir) => {
    const to = i + dir;
    if (to < 0 || to >= list.length) return;
    onChange(moveItem(list, i, to));
    setOpen((prev) => {
      const next = new Set(
        [...prev].map((idx) => (idx === i ? to : idx === to ? i : idx))
      );
      return next;
    });
  };

  const remove = (i) => {
    if (!window.confirm(`Delete "${itemTitle(list[i], i)}"?`)) return;
    onChange(list.filter((_, li) => li !== i));
    setOpen((prev) => new Set([...prev].filter((idx) => idx !== i).map((idx) => (idx > i ? idx - 1 : idx))));
  };

  const add = () => {
    onChange([...list, makeNew()]);
    setOpen((prev) => new Set([...prev, list.length]));
  };

  const patchAt = (i) => (part) =>
    onChange(list.map((item, li) => (li === i ? { ...item, ...part } : item)));

  return (
    <div className="admin-objlist">
      {list.map((item, i) => {
        const expanded = open.has(i);
        return (
          <div className="admin-item-card" key={i}>
            <div className="admin-item-head">
              <button type="button" className="admin-item-toggle" onClick={() => toggle(i)} aria-expanded={expanded}>
                <span className="admin-item-chevron">{expanded ? '▾' : '▸'}</span>
                <strong>{itemTitle(item, i)}</strong>
                {itemSubtitle && <span className="admin-muted"> {itemSubtitle(item)}</span>}
              </button>
              <div className="admin-item-actions">
                <button type="button" className="admin-btn admin-btn-sm" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="admin-btn admin-btn-sm" title="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" title="Delete" onClick={() => remove(i)}>✕</button>
              </div>
            </div>
            {expanded && <div className="admin-item-body">{renderItem(item, patchAt(i), i)}</div>}
          </div>
        );
      })}
      <button type="button" className="admin-btn" onClick={add}>{addLabel}</button>
    </div>
  );
}
