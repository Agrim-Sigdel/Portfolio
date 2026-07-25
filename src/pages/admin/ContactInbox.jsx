import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/lib/supabaseClient';

/*
 * ContactInbox: read/manage submissions from the public contact form.
 * SELECT/UPDATE here require an admin session (RLS); the public can only INSERT.
 */

const FILTERS = [
  { id: 'inbox', label: 'Inbox', statuses: ['new', 'read'] },
  { id: 'archived', label: 'Archived', statuses: ['archived'] },
  { id: 'all', label: 'All', statuses: null },
];

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

export default function ContactInbox() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('inbox');
  const [status, setStatus] = useState({ type: 'idle', msg: '' });

  const load = async (which = filter) => {
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

  // Mark unseen messages as read when the inbox opens them.
  useEffect(() => {
    const unseen = messages.filter((m) => m.status === 'new').map((m) => m.id);
    if (!unseen.length) return;
    supabase.from('contact_messages').update({ status: 'read' }).in('id', unseen).then(() => {});
  }, [messages]);

  return (
    <section className="admin-card">
      <div className="admin-inbox-head">
        <h2>Contact messages</h2>
        <nav className="admin-tabs admin-tabs-sm">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`admin-tab ${filter === f.id ? 'is-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </div>

      {status.msg && <p className={`admin-status admin-status-${status.type}`}>{status.msg}</p>}

      {!messages.length && status.type !== 'busy' && <p className="admin-muted">No messages here.</p>}

      <ul className="admin-msg-list">
        {messages.map((m) => (
          <li className={`admin-msg ${m.status === 'new' ? 'is-new' : ''}`} key={m.id}>
            <div className="admin-msg-top">
              <strong>{m.name}</strong>
              <a href={`mailto:${m.email}`} className="admin-msg-email">{m.email}</a>
              {m.phone && <span className="admin-muted"> · {m.phone}</span>}
              <span className="admin-muted admin-msg-date">{fmtDate(m.created_at)}</span>
            </div>
            <p className="admin-msg-body">{m.message}</p>
            <div className="admin-msg-actions">
              <a className="admin-btn admin-btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`}>Reply</a>
              {m.status !== 'archived' ? (
                <button className="admin-btn admin-btn-sm" onClick={() => setMsgStatus(m.id, 'archived')}>Archive</button>
              ) : (
                <button className="admin-btn admin-btn-sm" onClick={() => setMsgStatus(m.id, 'read')}>Unarchive</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
