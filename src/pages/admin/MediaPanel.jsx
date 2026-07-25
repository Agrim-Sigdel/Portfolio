import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../shared/lib/supabaseClient';

/*
 * MediaPanel: upload images to the public `media` bucket, then copy their URL to
 * paste into content (e.g. a project's image field). Uploads/deletes require an
 * admin session (Storage RLS); public read serves the images on the live site.
 */

const BUCKET = 'media';
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif,application/pdf';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (PDFs like the research paper run larger than images)

const isImage = (name) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(name);

// Storage object keys must be URL-safe; keep the extension, slug the stem.
const safeName = (name) => {
  const dot = name.lastIndexOf('.');
  const stem = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  return `${stem || 'file'}${ext}`;
};

const publicUrl = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export default function MediaPanel() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const [copied, setCopied] = useState('');
  const inputRef = useRef(null);

  const refresh = async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) {
      setStatus({ type: 'error', msg: error.message });
      return;
    }
    setFiles((data || []).filter((f) => f.id || f.name)); // drop folder placeholders
  };

  useEffect(() => {
    // refresh() only setState()s after an await, so it's not a synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const onPick = () => inputRef.current?.click();

  const onFiles = async (fileList) => {
    const list = Array.from(fileList || []);
    if (!list.length) return;
    for (const file of list) {
      if (file.size > MAX_BYTES) {
        setStatus({ type: 'error', msg: `${file.name} is over 10 MB.` });
        continue;
      }
      setStatus({ type: 'busy', msg: `Uploading ${file.name}…` });
      // Prefix with an index-free unique-ish key: name plus a short content hint.
      const key = `${safeName(file.name)}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, file, { upsert: true, contentType: file.type });
      if (error) {
        setStatus({ type: 'error', msg: `${file.name}: ${error.message}` });
        return;
      }
    }
    setStatus({ type: 'ok', msg: 'Uploaded.' });
    if (inputRef.current) inputRef.current.value = '';
    refresh();
  };

  const onDelete = async (name) => {
    if (!window.confirm(`Delete ${name}? Any content still referencing it will break.`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) {
      setStatus({ type: 'error', msg: error.message });
      return;
    }
    refresh();
  };

  const onCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      window.prompt('Copy this URL:', url);
    }
  };

  return (
    <section className="admin-card">
      <h2>Media</h2>
      <p className="admin-muted">
        Upload an image or PDF, then copy its URL and paste it into the relevant content
        field — e.g. a research paper link in the Content tab. (The CV has its own slot
        under Content → CV file.)
      </p>

      <div
        className="admin-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        onClick={onPick}
        role="button"
        tabIndex={0}
      >
        <p>Drop files here, or click to choose</p>
        <p className="admin-muted">PNG · JPG · WEBP · GIF · SVG · AVIF · PDF, up to 10 MB</p>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {status.msg && <p className={`admin-status admin-status-${status.type}`}>{status.msg}</p>}

      <div className="admin-media-grid">
        {files.map((f) => {
          const url = publicUrl(f.name);
          return (
            <figure className="admin-media-item" key={f.name}>
              {isImage(f.name) ? (
                <img src={url} alt={f.name} loading="lazy" />
              ) : (
                <div className="admin-media-fileicon" aria-hidden="true">
                  {(f.name.split('.').pop() || 'file').toUpperCase()}
                </div>
              )}
              <figcaption title={f.name}>{f.name}</figcaption>
              <div className="admin-media-actions">
                <button className="admin-btn admin-btn-sm" onClick={() => onCopy(url)}>
                  {copied === url ? 'Copied ✓' : 'Copy URL'}
                </button>
                <button className="admin-btn admin-btn-sm" onClick={() => onDelete(f.name)}>Delete</button>
              </div>
            </figure>
          );
        })}
        {!files.length && <p className="admin-muted">No files yet.</p>}
      </div>
    </section>
  );
}
