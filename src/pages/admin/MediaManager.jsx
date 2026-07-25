import React, { useRef, useState } from 'react';
import { uploadMedia, CV_STORAGE_PATH } from './adminMedia';

/*
 * CV file slot — lives in the Content tab (not the Media tab) because it
 * writes into the publishable content tree: common.media.cvUrl.
 *
 * Upload replaces a fixed object path in the `media` bucket (upsert), and the
 * stored URL gets a ?v= cache-buster — same path + CDN caching means a fresh
 * query param is what makes browsers fetch the replaced file. The site falls
 * back to the bundled /AgrimSigdel-CV.pdf whenever cvUrl is empty, so this is
 * always safe to revert.
 *
 * General media (research PDFs, images) lives in the Media tab: upload there,
 * Copy URL, and paste into any link field here.
 */

export default function MediaManager({ content, setField, onBusy }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const cvUrl = content.common.media?.cvUrl || '';

  const busy = (isBusy) => {
    setWorking(isBusy);
    onBusy?.(isBusy);
  };

  const onPick = async (file) => {
    if (!file) return;
    busy(true);
    setError('');
    try {
      const url = await uploadMedia(file, CV_STORAGE_PATH);
      setField('common.media', { ...(content.common.media ?? {}), cvUrl: `${url}?v=${Date.now()}` });
    } catch (e) {
      setError(`CV upload failed: ${e.message}`);
    } finally {
      busy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="admin-card">
      <h2>CV file</h2>
      <p className="admin-muted">
        {cvUrl ? (
          <>Serving from the backend: <code className="admin-break">{cvUrl}</code></>
        ) : (
          <>Using the bundled fallback <code>/AgrimSigdel-CV.pdf</code>.</>
        )}
      </p>
      <div className="admin-actions">
        <label className={`admin-btn${working ? ' admin-btn-disabled' : ''}`}>
          {working ? 'Uploading…' : 'Upload new CV (PDF)'}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            hidden
            disabled={working}
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </label>
        {cvUrl && (
          <button
            type="button"
            className="admin-btn"
            disabled={working}
            onClick={() => {
              const { cvUrl: _drop, ...rest } = content.common.media ?? {};
              setField('common.media', rest);
            }}
          >
            Revert to bundled file
          </button>
        )}
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="admin-muted">
        Changes go live after you Publish. For other files (research PDFs, images), use the
        Media tab — upload there, Copy URL, and paste it into any link field.
      </p>
    </section>
  );
}
