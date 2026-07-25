import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/lib/supabaseClient';

/*
 * ContactInbox: read/manage submissions from the public contact form.
 * SELECT/UPDATE here require an admin session (RLS); the public can only INSERT.
 *
 * Replies go out through the `send-reply` Edge Function rather than from here
 * directly: the Resend API key must never reach the browser. invoke() attaches
 * the logged-in admin's access token, which the function verifies.
 */

/* `sent` reads contact_replies instead of contact_messages, so it has no
 * `statuses` — the loader branches on the id rather than treating a null
 * statuses list as "no filter" the way `all` does. */
const FILTERS = [
  { id: 'inbox', label: 'Inbox', statuses: ['new', 'read'] },
  { id: 'archived', label: 'Archived', statuses: ['archived'] },
  { id: 'all', label: 'All', statuses: null },
  { id: 'sent', label: 'Sent' },
];

const DEFAULT_SUBJECT = 'Re: your message';
const EMPTY_COMPOSE = { to: '', subject: '', body: '' };

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

/*
 * supabase-js wraps a non-2xx function response in FunctionsHttpError and hides
 * the body on `error.context`. Without digging it out you get a useless
 * "Edge Function returned a non-2xx status code" — which would mask the single
 * most likely failure here, Resend refusing an unverified sending domain.
 */
const readFnError = async (error) => {
  try {
    const body = await error?.context?.json();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message */ }
  return error?.message || 'Send failed';
};

export default function ContactInbox() {
  const [messages, setMessages] = useState([]);
  const [replies, setReplies] = useState({});
  const [filter, setFilter] = useState('inbox');
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState({ subject: DEFAULT_SUBJECT, body: '', includeQuote: true });
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState(EMPTY_COMPOSE);
  const [sent, setSent] = useState([]);
  const [counts, setCounts] = useState({ unread: 0, inbox: 0, archived: 0, all: 0, sent: 0 });

  /* Tab counts. Statuses come back in one request and are tallied here rather
   * than issuing a count query per tab — four round trips to render four small
   * numbers isn't worth it at this volume. `head: true` on the replies count
   * asks for the count only, with no rows in the response. */
  const loadCounts = async () => {
    const [{ data: rows }, { count: sentCount }] = await Promise.all([
      supabase.from('contact_messages').select('status'),
      supabase.from('contact_replies').select('*', { count: 'exact', head: true }),
    ]);
    const list = rows || [];
    setCounts({
      unread: list.filter((r) => r.status === 'new').length,
      inbox: list.filter((r) => r.status === 'new' || r.status === 'read').length,
      archived: list.filter((r) => r.status === 'archived').length,
      all: list.length,
      sent: sentCount || 0,
    });
  };

  /* Everything sent from contact@agrimsigdel.com.np — replies and composed mail
   * alike. Replies carry a message_id; composed mail has null there. */
  const loadSent = async () => {
    setStatus({ type: 'busy', msg: 'Loading…' });
    const { data, error } = await supabase
      .from('contact_replies')
      .select('*')
      .order('sent_at', { ascending: false });
    if (error) {
      setStatus({ type: 'error', msg: error.message });
      return;
    }
    setSent(data || []);
    setStatus({ type: 'idle', msg: '' });
    loadCounts();
  };

  const load = async (which = filter) => {
    if (which === 'sent') return loadSent();
    setStatus({ type: 'busy', msg: 'Loading…' });
    let q = supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    const def = FILTERS.find((f) => f.id === which);
    if (def?.statuses) q = q.in('status', def.statuses);
    const { data, error } = await q;
    if (error) {
      setStatus({ type: 'error', msg: error.message });
      return;
    }
    setMessages(data || []);
    setStatus({ type: 'idle', msg: '' });
    loadCounts();

    const ids = (data || []).map((m) => m.id);
    if (!ids.length) {
      setReplies({});
      return;
    }
    const { data: reps } = await supabase
      .from('contact_replies')
      .select('*')
      .in('message_id', ids)
      .order('sent_at', { ascending: true });
    const grouped = {};
    (reps || []).forEach((r) => {
      (grouped[r.message_id] ||= []).push(r);
    });
    setReplies(grouped);
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setMsgStatus = async (id, newStatus) => {
    const { error } = await supabase.from('contact_messages').update({ status: newStatus }).eq('id', id);
    if (error) {
      setStatus({ type: 'error', msg: error.message });
      return;
    }
    load(filter);
  };

  /* Mark unseen messages read once the Inbox has displayed them.
   *
   * Scoped to the Inbox tab on purpose. It used to fire for any tab, so merely
   * glancing at "All" cleared the unread count for messages you never opened —
   * which would make the badge below untrustworthy. Counts are refreshed after
   * the update so the badge reflects the write we just made. */
  useEffect(() => {
    if (filter !== 'inbox') return;
    const unseen = messages.filter((m) => m.status === 'new').map((m) => m.id);
    if (!unseen.length) return;
    supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .in('id', unseen)
      .then(() => loadCounts());
  }, [messages, filter]);

  const openComposer = (m) => {
    setOpenId(m.id);
    setDraft({ subject: DEFAULT_SUBJECT, body: '', includeQuote: true });
    setStatus({ type: 'idle', msg: '' });
  };

  const send = async (m) => {
    if (!draft.body.trim()) {
      setStatus({ type: 'error', msg: 'Write something first.' });
      return;
    }
    setSending(true);
    setStatus({ type: 'busy', msg: `Sending to ${m.email}…` });

    const { error } = await supabase.functions.invoke('send-reply', {
      body: {
        messageId: m.id,
        subject: draft.subject.trim() || DEFAULT_SUBJECT,
        body: draft.body,
        includeQuote: draft.includeQuote,
      },
    });

    setSending(false);
    if (error) {
      setStatus({ type: 'error', msg: await readFnError(error) });
      return;
    }
    setStatus({ type: 'ok', msg: `Replied to ${m.email}.` });
    setOpenId(null);
    load(filter);
  };

  /* Compose a fresh message, not tied to any incoming one. Sends through the
   * same function; passing `to` instead of `messageId` selects compose mode. */
  const sendCompose = async () => {
    if (!compose.to.trim()) {
      setStatus({ type: 'error', msg: 'Who is it going to?' });
      return;
    }
    if (!compose.body.trim()) {
      setStatus({ type: 'error', msg: 'Write something first.' });
      return;
    }
    setSending(true);
    setStatus({ type: 'busy', msg: `Sending to ${compose.to.trim()}…` });

    const { error } = await supabase.functions.invoke('send-reply', {
      body: {
        to: compose.to.trim(),
        subject: compose.subject.trim(),
        body: compose.body,
      },
    });

    setSending(false);
    if (error) {
      setStatus({ type: 'error', msg: await readFnError(error) });
      return;
    }
    setStatus({ type: 'ok', msg: `Sent to ${compose.to.trim()}.` });
    setCompose(EMPTY_COMPOSE);
    setComposeOpen(false);
    load(filter);
  };

  return (
    <section className="admin-card">
      <div className="admin-inbox-head">
        <h2>Contact messages</h2>
        <nav className="admin-tabs admin-tabs-sm">
          {FILTERS.map((f) => {
            // Inbox leads with unread when there is any — that's the number you
            // actually act on. With nothing unread it falls back to the total,
            // so the tab never reads as empty when it isn't.
            const unreadHere = f.id === 'inbox' && counts.unread > 0;
            const n = unreadHere ? counts.unread : counts[f.id];
            return (
              <button
                key={f.id}
                className={`admin-tab ${filter === f.id ? 'is-active' : ''}`}
                onClick={() => setFilter(f.id)}
                aria-label={unreadHere ? `${f.label}, ${n} unread` : `${f.label}, ${n}`}
              >
                {f.label}
                {n > 0 && (
                  <span className={`admin-tab-count ${unreadHere ? 'is-unread' : ''}`}>{n}</span>
                )}
              </button>
            );
          })}
          <button
            className="admin-btn admin-btn-sm admin-btn-primary admin-compose-toggle"
            onClick={() => {
              setComposeOpen((o) => !o);
              setStatus({ type: 'idle', msg: '' });
            }}
          >
            {composeOpen ? 'Close' : 'New message'}
          </button>
        </nav>
      </div>

      {status.msg && <p className={`admin-status admin-status-${status.type}`}>{status.msg}</p>}

      {composeOpen && (
        <div className="admin-reply-box admin-compose">
          <p className="admin-muted admin-compose-from">
            From <strong>contact@agrimsigdel.com.np</strong>
          </p>
          <label className="admin-field">
            <span>To</span>
            <input
              type="email"
              value={compose.to}
              placeholder="someone@example.com"
              onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))}
            />
          </label>
          <label className="admin-field">
            <span>Subject</span>
            <input
              value={compose.subject}
              placeholder="Message from Agrim Sigdel"
              onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
            />
          </label>
          <label className="admin-field">
            <span>Message</span>
            <textarea
              rows={8}
              value={compose.body}
              placeholder="Hi there,"
              onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
            />
          </label>
          <div className="admin-msg-actions">
            <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={sendCompose} disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
            <button
              className="admin-btn admin-btn-sm"
              onClick={() => { setCompose(EMPTY_COMPOSE); setComposeOpen(false); }}
              disabled={sending}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {filter === 'sent' ? (
        <>
          {!sent.length && status.type !== 'busy' && (
            <p className="admin-muted">Nothing sent yet.</p>
          )}
          <ul className="admin-msg-list">
            {sent.map((r) => (
              <li className="admin-msg" key={r.id}>
                <div className="admin-msg-top">
                  <strong>To {r.to_email}</strong>
                  <span className="admin-msg-badge admin-msg-badge-quiet">
                    {r.message_id ? 'Reply' : 'Composed'}
                  </span>
                  <span className="admin-muted admin-msg-date">{fmtDate(r.sent_at)}</span>
                </div>
                <p className="admin-sent-subject">{r.subject}</p>
                <p className="admin-msg-body">{r.body}</p>
                {r.sent_by && <p className="admin-muted admin-sent-meta">Sent by {r.sent_by}</p>}
              </li>
            ))}
          </ul>
        </>
      ) : (
      <>
      {!messages.length && status.type !== 'busy' && <p className="admin-muted">No messages here.</p>}

      <ul className="admin-msg-list">
        {messages.map((m) => (
          <li className={`admin-msg ${m.status === 'new' ? 'is-new' : ''}`} key={m.id}>
            <div className="admin-msg-top">
              <strong>{m.name}</strong>
              <a href={`mailto:${m.email}`} className="admin-msg-email">{m.email}</a>
              {m.phone && <span className="admin-muted"> · {m.phone}</span>}
              {m.replied_at && <span className="admin-msg-badge">Replied</span>}
              <span className="admin-muted admin-msg-date">{fmtDate(m.created_at)}</span>
            </div>
            <p className="admin-msg-body">{m.message}</p>

            {(replies[m.id] || []).map((r) => (
              <div className="admin-reply-sent" key={r.id}>
                <span className="admin-reply-sent-head">
                  You · {fmtDate(r.sent_at)} · {r.subject}
                </span>
                <p>{r.body}</p>
              </div>
            ))}

            {openId === m.id ? (
              <div className="admin-reply-box">
                <label className="admin-field">
                  <span>Subject</span>
                  <input
                    value={draft.subject}
                    onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                  />
                </label>
                <label className="admin-field">
                  <span>Message</span>
                  <textarea
                    rows={7}
                    value={draft.body}
                    placeholder={`Hi ${String(m.name || '').split(' ')[0] || 'there'},`}
                    onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                  />
                </label>
                <label className="admin-reply-quote">
                  <input
                    type="checkbox"
                    checked={draft.includeQuote}
                    onChange={(e) => setDraft((d) => ({ ...d, includeQuote: e.target.checked }))}
                  />
                  Quote their original message
                </label>
                <div className="admin-msg-actions">
                  <button
                    className="admin-btn admin-btn-sm admin-btn-primary"
                    onClick={() => send(m)}
                    disabled={sending}
                  >
                    {sending ? 'Sending…' : 'Send reply'}
                  </button>
                  <button
                    className="admin-btn admin-btn-sm"
                    onClick={() => setOpenId(null)}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-msg-actions">
                <button className="admin-btn admin-btn-sm" onClick={() => openComposer(m)}>
                  {m.replied_at ? 'Reply again' : 'Reply'}
                </button>
                <a
                  className="admin-btn admin-btn-sm"
                  href={`mailto:${m.email}?subject=${encodeURIComponent(DEFAULT_SUBJECT)}`}
                >
                  Open in mail app
                </a>
                {m.status !== 'archived' ? (
                  <button className="admin-btn admin-btn-sm" onClick={() => setMsgStatus(m.id, 'archived')}>Archive</button>
                ) : (
                  <button className="admin-btn admin-btn-sm" onClick={() => setMsgStatus(m.id, 'read')}>Unarchive</button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      </>
      )}
    </section>
  );
}
