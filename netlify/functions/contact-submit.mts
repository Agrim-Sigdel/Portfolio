import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

// Mirrors the client-side rules in src/shared/ui/ContactForm.jsx — the client
// check is for UX, this one is the actual trust boundary since anyone can POST
// here directly, bypassing the browser entirely.
const MAX_LENGTHS = { name: 80, email: 120, phone: 20, message: 1000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

const WINDOW_MS = 60 * 60 * 1000; // rolling window per IP
const MAX_PER_WINDOW = 5; // submissions allowed per window
const MIN_INTERVAL_MS = 20 * 1000; // cooldown between consecutive submissions
const MIN_FILL_TIME_MS = 3000; // faster than this since the form rendered = bot

type Fields = { name?: string; email?: string; phone?: string; message?: string; startedAt?: number; 'bot-field'?: string };

function validate(fields: Fields) {
  const errors: Record<string, string> = {};
  const name = (fields.name || '').trim();
  const email = (fields.email || '').trim();
  const phone = (fields.phone || '').trim();
  const message = (fields.message || '').trim();

  if (!name) errors.name = 'Name is required.';
  else if (name.length > MAX_LENGTHS.name) errors.name = 'Name is too long.';

  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email) || email.length > MAX_LENGTHS.email) errors.email = 'Invalid email address.';

  if (phone && (!PHONE_RE.test(phone) || phone.length > MAX_LENGTHS.phone)) errors.phone = 'Invalid phone number.';

  if (!message) errors.message = 'Message is required.';
  else if (message.length < 10 || message.length > MAX_LENGTHS.message) errors.message = 'Invalid message length.';

  return errors;
}

// Hash the IP rather than storing it raw — the store only needs to recognize
// "same sender again", not know who they are.
function keyFor(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: Fields;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot: real visitors never populate this hidden field.
  if (body['bot-field']) {
    return Response.json({ ok: true });
  }

  // A bot that skips rendering time entirely submits implausibly fast.
  const startedAt = Number(body.startedAt);
  if (!startedAt || Date.now() < startedAt || Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return Response.json({ error: 'Please try again.' }, { status: 400 });
  }

  const errors = validate(body);
  if (Object.keys(errors).length > 0) {
    return Response.json({ error: 'Validation failed.', fields: errors }, { status: 400 });
  }

  const ip = context.ip || 'unknown';
  const store = getStore({ name: 'contact-rate-limit', consistency: 'strong' });
  const key = keyFor(ip);
  const now = Date.now();

  const record = (await store.get(key, { type: 'json' })) as { count: number; windowStart: number; last: number } | null;

  if (record) {
    const withinWindow = now - record.windowStart < WINDOW_MS;
    const sinceLast = now - record.last;

    if (withinWindow && sinceLast < MIN_INTERVAL_MS) {
      return Response.json(
        { error: 'Please wait a moment before sending another message.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((MIN_INTERVAL_MS - sinceLast) / 1000)) } }
      );
    }

    if (withinWindow && record.count >= MAX_PER_WINDOW) {
      return Response.json(
        { error: 'Too many messages sent recently. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((WINDOW_MS - (now - record.windowStart)) / 1000)) } }
      );
    }

    await store.setJSON(key, {
      count: withinWindow ? record.count + 1 : 1,
      windowStart: withinWindow ? record.windowStart : now,
      last: now,
    });
  } else {
    await store.setJSON(key, { count: 1, windowStart: now, last: now });
  }

  // Forward the verified submission to Netlify Forms so it still lands in the
  // Forms dashboard and triggers whatever notifications are configured there.
  const origin = new URL(req.url).origin;
  const formBody = new URLSearchParams({
    'form-name': 'contact',
    name: body.name!.trim(),
    email: body.email!.trim(),
    phone: (body.phone || '').trim(),
    message: body.message!.trim(),
  });

  try {
    const formsRes = await fetch(`${origin}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    });
    if (!formsRes.ok) throw new Error(`forms endpoint responded ${formsRes.status}`);
  } catch (err) {
    console.error('Failed to forward contact submission to Netlify Forms', err);
    return Response.json({ error: 'Could not deliver your message right now.' }, { status: 502 });
  }

  return Response.json({ ok: true });
};
