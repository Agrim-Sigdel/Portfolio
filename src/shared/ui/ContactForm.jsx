import React, { useState } from 'react';
import content from '../../data/content.json';

/*
 * ContactForm: contact form backed by Netlify Forms.
 *
 * Submissions are POSTed (URL-encoded) to Netlify, which stores them in the
 * site's Forms dashboard and (once configured there) emails a notification per
 * submission. Netlify detects the form at build time via the hidden static
 * <form name="contact"> stub in index.html — this React form just has to POST
 * with a matching `form-name` field. A hidden `bot-field` honeypot catches bots.
 *
 * If the POST fails (e.g. running locally without Netlify), we fall back to a
 * mailto: link so the visitor can still reach out.
 *
 * `variant` ("fun" | "cv") only switches the class namespace so each mode can
 * style the same markup to fit its surroundings.
 */

const encode = (data) =>
  Object.keys(data)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`)
    .join('&');

export default function ContactForm({ variant = 'fun', className = '' }) {
  const { email } = content.common.contact;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const ns = variant === 'cv' ? 'cv-contactform' : 'cf';

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const honeypot = e.target['bot-field']?.value;
    if (honeypot) return; // bot filled the hidden field — silently drop

    setStatus('sending');
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({ 'form-name': 'contact', 'bot-field': '', ...form }),
      });
      if (!res.ok) throw new Error(`Netlify responded ${res.status}`);
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      // Fallback: open the visitor's mail client pre-filled so they can still reach out.
      const subject = `Portfolio contact from ${form.name || 'someone'}`;
      const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('error');
    }
  };

  return (
    <form
      className={`${ns} ${className}`}
      name="contact"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Required so Netlify routes the JS-submitted POST to the right form. */}
      <input type="hidden" name="form-name" value="contact" />
      {/* Honeypot: hidden from humans, tempting to bots. */}
      <p hidden>
        <label>
          Don’t fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className={`${ns}-row`}>
        <label className={`${ns}-field`}>
          <span className={`${ns}-label`}>Name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={update('name')}
            placeholder="Your name"
            className={`${ns}-input`}
          />
        </label>
        <label className={`${ns}-field`}>
          <span className={`${ns}-label`}>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            className={`${ns}-input`}
          />
        </label>
      </div>

      <label className={`${ns}-field`}>
        <span className={`${ns}-label`}>Message</span>
        <textarea
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={update('message')}
          placeholder="Tell me about your project or idea…"
          className={`${ns}-input ${ns}-textarea`}
        />
      </label>

      <div className={`${ns}-actions`}>
        <button type="submit" className={`${ns}-submit`} disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {status === 'sent' && (
          <span className={`${ns}-sent`} role="status">
            Thanks — your message is on its way. I’ll get back to you soon.
          </span>
        )}
        {status === 'error' && (
          <span className={`${ns}-sent`} role="status">
            Couldn’t send automatically — opening your mail app. Or email me at{' '}
            <a href={`mailto:${email}`}>{email}</a>.
          </span>
        )}
      </div>
    </form>
  );
}
