import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiLoader, FiCheck } from 'react-icons/fi';

/**
 * A download trigger that guards against double-presses.
 * States: idle -> loading -> done -> idle. While loading/done, further
 * clicks are ignored so the file can't be requested twice in a row.
 *
 * Renders an <a download> for accessibility/right-click-save, but intercepts
 * the click to drive the visual state and trigger the download once.
 *
 * Two modes:
 *   - Static file:  pass `href` (+ optional `filename`).
 *   - Generated file: pass `getFile`, an async () => { blob, filename }.
 *     Used to build a file on the fly (e.g. a PDF from live content).
 */
const triggerDownload = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const DownloadButton = ({
  href,
  filename,
  getFile,
  className = '',
  style,
  idleLabel = 'Download',
  loadingLabel = 'Downloading…',
  doneLabel = 'Downloaded',
}) => {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'done'
  const timersRef = useRef([]);

  // Clear any pending timers if the component unmounts mid-cycle.
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const finish = () => {
    // Brief loading window, then a "done" confirmation, then reset.
    timersRef.current.push(
      setTimeout(() => setState('done'), 900),
      setTimeout(() => setState('idle'), 2400),
    );
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (state !== 'idle') return; // guard: ignore clicks while busy/done

    setState('loading');

    if (getFile) {
      // Build the file on demand, then download it from an object URL.
      Promise.resolve()
        .then(getFile)
        .then(({ blob, filename: name }) => {
          const url = URL.createObjectURL(blob);
          triggerDownload(url, name);
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          finish();
        })
        .catch(() => setState('idle')); // let the visitor retry on failure
      return;
    }

    triggerDownload(href, filename);
    finish();
  };

  const icon =
    state === 'loading' ? (
      <FiLoader aria-hidden="true" className="db-spin" />
    ) : state === 'done' ? (
      <FiCheck aria-hidden="true" />
    ) : (
      <FiDownload aria-hidden="true" />
    );

  const label =
    state === 'loading' ? loadingLabel : state === 'done' ? doneLabel : idleLabel;

  return (
    <a
      href={href || '#'}
      download={filename || true}
      onClick={handleClick}
      className={`${className} ${state !== 'idle' ? 'is-busy' : ''}`.trim()}
      style={style}
      aria-busy={state === 'loading'}
      aria-disabled={state !== 'idle'}
    >
      {icon} {label}
    </a>
  );
};

export default DownloadButton;
