import React, { useState } from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { useTheme } from '../../shared/lib/ThemeContext';
import ContentEditor from './ContentEditor';
import MediaPanel from './MediaPanel';
import ContactInbox from './ContactInbox';

/*
 * AdminShell: the signed-in admin frame. Owns the top bar (tabs + who + sign out)
 * and renders one panel at a time. Each panel manages its own data + actions.
 */

const TABS = [
  { id: 'content', label: 'Content' },
  { id: 'media', label: 'Media' },
  { id: 'inbox', label: 'Inbox' },
];

export default function AdminShell({ session, onSignOut }) {
  const [tab, setTab] = useState('content');
  const { theme, toggleTheme } = useTheme();
  const email = session?.user?.email;

  return (
    <div className="admin-shell admin-editor">
      <header className="admin-topbar">
        <nav className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="admin-actions">
          <span className="admin-muted admin-hide-sm">{email}</span>
          <button
            className="admin-btn admin-btn-icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <MdLightMode aria-hidden="true" /> : <MdDarkMode aria-hidden="true" />}
          </button>
          <button className="admin-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <main className="admin-main">
        {tab === 'content' && <ContentEditor />}
        {tab === 'media' && <MediaPanel />}
        {tab === 'inbox' && <ContactInbox />}
      </main>
    </div>
  );
}
