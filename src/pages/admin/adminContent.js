import { supabase } from '../../shared/lib/supabaseClient';
import { getContent, setContent } from '../../shared/lib/contentStore';

/*
 * Admin-side content service: load the current tree for editing, and publish
 * edits back to Supabase.
 *
 * `publishContent` does three things in order:
 *   1. writes a snapshot of the *current* row into content_history (undo trail),
 *   2. upserts the new tree into site_content (the live row),
 *   3. updates the in-memory store so the running app reflects it immediately.
 * RLS allows these writes only for an authenticated (admin) session.
 */

/** Load the live content row for editing; falls back to the in-memory tree. */
export async function loadContent() {
  if (!supabase) return getContent();
  const { data, error } = await supabase
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.content ?? getContent();
}

/** Publish an edited tree: snapshot old -> save new -> update live store. */
export async function publishContent(nextContent) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData?.user?.id ?? null;

  // 1. Snapshot the current row for undo (best-effort — don't block on failure).
  const { data: currentRow } = await supabase
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .maybeSingle();
  if (currentRow?.content) {
    await supabase
      .from('content_history')
      .insert({ content: currentRow.content, created_by: userId });
  }

  // 2. Upsert the new live content.
  const { error } = await supabase
    .from('site_content')
    .upsert(
      { id: 1, content: nextContent, updated_at: new Date().toISOString(), updated_by: userId },
      { onConflict: 'id' }
    );
  if (error) throw new Error(error.message);

  // 3. Reflect immediately in the running app.
  setContent(nextContent);
}
