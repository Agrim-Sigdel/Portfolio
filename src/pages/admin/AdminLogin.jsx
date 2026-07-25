import React, { useState } from 'react';
import { supabase } from '../../shared/lib/supabaseClient';

/*
 * AdminLogin: email + password sign-in against Supabase Auth.
 *
 * Public signup is disabled in the Supabase dashboard, so there is deliberately
 * no "create account" path — the only user is the admin created by hand.
 */

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    // On success, AdminPage's onAuthStateChange swaps in the editor.
  };

  return (
    <div className="admin-shell">
      <form className="admin-card admin-login" onSubmit={onSubmit}>
        <h1>Admin</h1>
        <p className="admin-muted">Sign in to edit site content.</p>

        <label className="admin-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <button className="admin-btn admin-btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
