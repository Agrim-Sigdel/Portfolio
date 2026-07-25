import { createClient } from '@supabase/supabase-js';

/*
 * Single shared Supabase browser client.
 *
 * Only the anon (public) key ever reaches the browser — access is enforced by
 * Row-Level Security on the server, not by hiding the key. If the env vars are
 * missing (e.g. a fresh checkout without .env.local), we export `null` so the
 * app degrades gracefully to the baked-in content.json instead of crashing.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
