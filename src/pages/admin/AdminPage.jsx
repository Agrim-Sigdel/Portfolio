import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../shared/lib/supabaseClient';
import { useTheme } from '../../shared/lib/ThemeContext';
import AdminLogin from './AdminLogin';
import AdminShell from './AdminShell';
import './admin.css';

/*
 * AdminPage: the hidden /admin surface.
 *
 * Not linked from anywhere in the public site. Visibility is not the security
 * boundary, though — Row-Level Security is. Even with the route, an unauthenticated
 * visitor can only read public content; every write requires a valid admin session.
 *
 * This component just gates on the Supabase auth session: no session -> login form,
 * session -> the content editor.
 */

export default function AdminPage() {
  const [session, setSession] = useState(null);
  // Ready immediately when there's nothing to fetch; otherwise wait for getSession.
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    // Current session on load, then keep in sync with sign in/out.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // The admin follows the visitor-facing theme preference (toggle in AdminShell).
  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.overflow = 'auto';
  }, [theme]);

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-shell">
        <div className="admin-card">
          <h1>Admin unavailable</h1>
          <p className="admin-muted">
            Supabase isn’t configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="admin-shell">
        <div className="admin-card">
          <span className="db-spin admin-spin" />
        </div>
      </div>
    );
  }

  if (!session) return <AdminLogin />;

  return <AdminShell session={session} onSignOut={() => supabase.auth.signOut()} />;
}
