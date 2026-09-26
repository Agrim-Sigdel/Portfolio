import React, { useState } from 'react';
import { useContent } from '../lib/contentStore';
import { supabase } from '../lib/supabaseClient';

/*
 * ContactForm: contact form backed by Supabase.
 *
 * Submissions are inserted into the `contact_messages` table (public INSERT via
 * RLS). They surface in the /admin Inbox, and a Database Webhook → Edge Function
 * emails a notification per submission. A hidden `bot-field` honeypot drops bots.
 *
 * Validation runs client-side before submit (and per-field on blur once a field
 * has been touched): name + message required, email required and well-formed,
 * phone optional but validated if provided.
 *
 * If the insert fails (e.g. Supabase unconfigured locally), we fall back to a
 * mailto: link so the visitor can still reach out.
 *
 * `variant` ("fun" | "cv" | "terminal") only switches the class namespace so
 * each mode can style the same markup to fit its surroundings.
 */

const NAMESPACES = { cv: 'cv-contactform', terminal: 'tcf', fun: 'cf' };

// Pragmatic email check — not RFC-perfect, but rejects the common mistakes.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone: optional. Allow digits, spaces, dashes, parens, leading +; 7–15 digits.
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

// Max characters per field. `maxLength` on the inputs hard-caps typing/paste;
// validate() double-checks so the error surfaces if a limit is ever bypassed.
const MAX_LENGTHS = { name: 80, email: 120, phone: 20, message: 1000 };

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  else if (form.name.trim().length > MAX_LENGTHS.name)
    errors.name = `Name is too long (max ${MAX_LENGTHS.name} characters).`;
  if (!form.email.trim()) errors.email = 'Please enter your email.';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim()))
    errors.phone = 'Please enter a valid phone number.';
  if (!form.message.trim()) errors.message = 'Please enter a message.';
  else if (form.message.trim().length < 10)
    errors.message = 'Message is a little short, add a few more details.';
  else if (form.message.length > MAX_LENGTHS.message)
    errors.message = `Message is too long (max ${MAX_LENGTHS.message} characters).`;
  return errors;
};

const EMPTY = { name: '', email: '', phone: '', message: '' };

export default function ContactForm({ variant = 'fun', className = '', onSent }) {
  const { email } = useContent().common.contact;
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
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim(),
      });
      if (error) throw error;
      setStatus('sent');
      setForm(EMPTY);
      setTouched({});
      import('react-hot-toast').then(({ default: toast }) => toast.success('Message sent!'));
      onSent?.();
    } catch (e) {
      console.error('ContactForm submit error:', e);
      import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to send automatically. Opening your email app instead.'));
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

  const field = (name, label, { type = 'text', autoComplete, placeholder, optional = false, required = false } = {}) => {
    const err = errFor(name);
    const errId = `${ns}-err-${name}`;
    return (
      <label className={`${ns}-field`}>
        <span className={`${ns}-label`}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
          {optional && <span className={`${ns}-optional`}> (optional)</span>}
        </span>
        <input
          type={type}
          name={name}
          maxLength={MAX_LENGTHS[name]}
          autoComplete={autoComplete}
          value={form[name]}
          onChange={update(name)}
          onBlur={handleBlur(name)}
          placeholder={placeholder}
          className={`${ns}-input ${err ? `${ns}-input--error` : ''}`}
          required={required}
          aria-required={required ? 'true' : undefined}
          aria-invalid={err ? 'true' : undefined}
          aria-describedby={err ? errId : undefined}
        />
        {err && <span id={errId} className={`${ns}-error`} role="alert">{err}</span>}
      </label>
    );
  };

  const messageErr = errFor('message');

  return (
    <form
      className={`${ns} ${className}`}
      name="contact"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Honeypot: hidden from humans, tempting to bots. */}
      <p hidden>
        <label>
          Don’t fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className={`${ns}-row`}>
        {field('name', 'Name', { autoComplete: 'name', placeholder: 'Your name', required: true })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com', required: true })}
      </div>

      {field('phone', 'Phone', {
        type: 'tel',
        autoComplete: 'tel',
        placeholder: '+977 98XXXXXXXX',
        optional: true,
      })}

      <label className={`${ns}-field`}>
        <span className={`${ns}-label`}>
          Message
          <span aria-hidden="true"> *</span>
        </span>
        <textarea
          name="message"
          rows={5}
          maxLength={MAX_LENGTHS.message}
          value={form.message}
          onChange={update('message')}
          onBlur={handleBlur('message')}
          placeholder="Tell me about your project or idea…"
          className={`${ns}-input ${ns}-textarea ${messageErr ? `${ns}-input--error` : ''}`}
          required
          aria-required="true"
          aria-invalid={messageErr ? 'true' : undefined}
          aria-describedby={messageErr ? `${ns}-err-message` : undefined}
        />
        <span className={`${ns}-counter`} aria-live="polite">
          {form.message.length}/{MAX_LENGTHS.message}
        </span>
        {messageErr && <span id={`${ns}-err-message`} className={`${ns}-error`} role="alert">{messageErr}</span>}
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
