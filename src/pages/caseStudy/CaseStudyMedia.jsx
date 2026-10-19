import { useEffect, useRef, useState } from 'react';
import { FiMaximize2, FiX } from 'react-icons/fi';

function Screenshot({ item, priority }) {
  const dialog = useRef(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (failed) return <p className="cs-media-unavailable">This image is unavailable. <a href={item.url} target="_blank" rel="noopener noreferrer">Open the original</a></p>;

  return (
    <>
      <button
        className="cs-image-button"
        type="button"
        aria-label={`Enlarge: ${item.alt || item.caption || 'project screenshot'}`}
        onClick={() => { dialog.current.showModal(); setOpen(true); }}
      >
        <img src={item.url} alt={item.alt || ''} width={item.width || undefined} height={item.height || undefined} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
        <span className="cs-image-expand"><FiMaximize2 aria-hidden="true" /> View full size</span>
      </button>
      <dialog ref={dialog} className="cs-lightbox" aria-label={item.alt || 'Project screenshot'} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
        <button className="cs-lightbox-close" type="button" autoFocus onClick={() => dialog.current.close()} aria-label="Close image"><FiX aria-hidden="true" /></button>
        {open && <img src={item.url} alt={item.alt || ''} />}
        {item.caption && <p>{item.caption}</p>}
      </dialog>
    </>
  );
}

export default function CaseStudyMedia({ items, className = '', priority = false }) {
  const media = (items ?? []).filter((item) => item?.url);
  if (!media.length) return null;
  return (
    <div className={`cs-media${media.length === 1 ? ' cs-media-single' : ''} ${className}`.trim()}>
      {media.map((item, index) => (
        <figure className="cs-media-item" key={`${item.url}-${index}`}>
          {item.type === 'video' ? (
            <video src={item.url} poster={item.poster || undefined} controls playsInline preload="none" aria-label={item.alt || item.caption || 'Project demo'} />
          ) : <Screenshot item={item} priority={priority && index === 0} />}
          {item.caption && <figcaption>{item.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
