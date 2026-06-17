import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ContactForm from './ContactForm';
import './ContactModal.css';

/*
 * ContactModal: one shared contact dialog used by every mode (fun, cv, terminal)
 * and the mode selector. Each caller passes a `variant` so the backdrop, panel
 * chrome and accent match that mode's aesthetic, but the form inside is always
 * the same <ContactForm> wired to the Netlify backend — one source of truth.
 *
 * Behaviour: opens over the current mode, closes on Esc / backdrop click / the
 * × button, locks body scroll while open, and restores focus on close.
 */

const TITLES = {
  fun: 'Get in touch',
  cv: 'Send a message',
  terminal: '~/contact — new message',
};

const SUBTITLES = {
  fun: "Tell me about your project or idea — I'll get back to you.",
  cv: 'Have a role, project or research idea in mind? Drop me a line.',
  terminal: 'Fill the fields below and hit send. Esc to abort.',
};

export default function ContactModal({ open, onClose, variant = 'fun' }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);

    // Focus the first field for keyboard users.
    const t = setTimeout(() => {
      panelRef.current?.querySelector('input, textarea')?.focus();
    }, 60);

    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`cm-overlay cm-${variant}`}
      role="dialog"
      aria-modal="true"
      aria-label="Contact form"
      onMouseDown={(e) => {
        // Close only when the backdrop itself is clicked, not the panel.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cm-panel" ref={panelRef}>
        <button type="button" className="cm-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <header className="cm-head">
          <h2 className="cm-title">{TITLES[variant] || TITLES.fun}</h2>
          <p className="cm-sub">{SUBTITLES[variant] || SUBTITLES.fun}</p>
        </header>

        <ContactForm variant={variant} />
      </div>
    </div>,
    document.body
  );
}
