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
 * Validation runs client-side before submit (and per-field on blur once a field
 * has been touched): name + message required, email required and well-formed,
 * phone optional but validated if provided.
 *
 * If the POST fails (e.g. running locally without Netlify), we fall back to a
 * mailto: link so the visitor can still reach out.
 *
 * `variant` ("fun" | "cv" | "terminal") only switches the class namespace so
 * each mode can style the same markup to fit its surroundings.
 */

const NAMESPACES = { cv: 'cv-contactform', terminal: 'tcf', fun: 'cf' };

const encode = (data) =>
  Object.keys(data)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`)
    .join('&');

// Pragmatic email check — not RFC-perfect, but rejects the common mistakes.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone: optional. Allow digits, spaces, dashes, parens, leading +; 7–15 digits.
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  if (!form.email.trim()) errors.email = 'Please enter your email.';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim()))
    errors.phone = 'Please enter a valid phone number.';
  if (!form.message.trim()) errors.message = 'Please enter a message.';
  else if (form.message.trim().length < 10)
    errors.message = 'Message is a little short, add a few more details.';
  return errors;
};

const EMPTY = { name: '', email: '', phone: '', message: '' };

export default function ContactForm({ variant = 'fun', className = '', onSent }) {
  const { email } = content.common.contact;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const ns = NAMESPACES[variant] || NAMESPACES.fun;

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Re-validate this field live once it's been touched, to clear errors as fixed.
      if (touched[field]) setErrors((prev) => ({ ...prev, [field]: validate(next)[field] }));
      return next;
    });
  };

  const handleBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(form)[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const honeypot = e.target['bot-field']?.value;
    if (honeypot) return; // bot filled the hidden field — silently drop

    const found = validate(form);
    setErrors(found);
    setTouched({ name: true, email: true, phone: true, message: true });
    if (Object.values(found).some(Boolean)) {
      setStatus('idle');
      return; // block submit until valid
    }

    setStatus('sending');
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({ 'form-name': 'contact', 'bot-field': '', ...form }),
      });
      if (!res.ok) throw new Error(`Netlify responded ${res.status}`);
      setStatus('sent');
      setForm(EMPTY);
      setTouched({});
      onSent?.();
    } catch (err) {
      // Fallback: open the visitor's mail client pre-filled so they can still reach out.
      const subject = `Portfolio contact from ${form.name || 'someone'}`;
      const phoneLine = form.phone ? `Phone: ${form.phone}\n` : '';
      const body = `Name: ${form.name}\nEmail: ${form.email}\n${phoneLine}\n${form.message}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('error');
    }
  };

  // A field's error is only shown once the field has been touched.
  const errFor = (field) => (touched[field] ? errors[field] : '');

  const field = (name, label, { type = 'text', autoComplete, placeholder, optional = false } = {}) => {
    const err = errFor(name);
    return (
      <label className={`${ns}-field`}>
        <span className={`${ns}-label`}>
          {label}
          {optional && <span className={`${ns}-optional`}> (optional)</span>}
        </span>
        <input
          type={type}
          name={name}
          autoComplete={autoComplete}
          value={form[name]}
          onChange={update(name)}
          onBlur={handleBlur(name)}
          placeholder={placeholder}
          className={`${ns}-input ${err ? `${ns}-input--error` : ''}`}
          aria-invalid={err ? 'true' : undefined}
        />
        {err && <span className={`${ns}-error`} role="alert">{err}</span>}
      </label>
    );
  };

  const messageErr = errFor('message');

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
        {field('name', 'Name', { autoComplete: 'name', placeholder: 'Your name' })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
      </div>

      {field('phone', 'Phone', {
        type: 'tel',
        autoComplete: 'tel',
        placeholder: '+977 98XXXXXXXX',
        optional: true,
      })}

      <label className={`${ns}-field`}>
        <span className={`${ns}-label`}>Message</span>
        <textarea
          name="message"
          rows={5}
          value={form.message}
          onChange={update('message')}
          onBlur={handleBlur('message')}
          placeholder="Tell me about your project or idea…"
          className={`${ns}-input ${ns}-textarea ${messageErr ? `${ns}-input--error` : ''}`}
          aria-invalid={messageErr ? 'true' : undefined}
        />
        {messageErr && <span className={`${ns}-error`} role="alert">{messageErr}</span>}
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
