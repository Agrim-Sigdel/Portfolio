import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiLoader, FiCheck } from 'react-icons/fi';

/**
 * A download trigger that guards against double-presses.
 * States: idle -> loading -> done -> idle. While loading/done, further
 * clicks are ignored so the file can't be requested twice in a row.
 *
 * Renders an <a download> for accessibility/right-click-save, but intercepts
 * the click to drive the visual state and trigger the download once.
 */
const DownloadButton = ({
  href,
  filename,
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

  const handleClick = (e) => {
    e.preventDefault();
    if (state !== 'idle') return; // guard: ignore clicks while busy/done

    setState('loading');

    // Trigger the actual download via a transient anchor.
    const a = document.createElement('a');
    a.href = href;
    if (filename) a.download = filename;
    else a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Brief loading window, then a "done" confirmation, then reset.
    timersRef.current.push(
      setTimeout(() => setState('done'), 900),
      setTimeout(() => setState('idle'), 2400),
    );
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
      href={href}
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
