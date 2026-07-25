import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { setContent } from './contentStore';

/*
 * ContentProvider: hydrates the content store from Supabase once on mount.
 *
 * It renders its children immediately — the store already holds the baked-in
 * content.json, so there is no loading gate and the landing page's first paint
 * is unaffected. When the fetch resolves, `setContent()` swaps in the live copy
 * and any subscribed components re-render. If Supabase isn't configured or the
 * fetch fails, the seed content simply stays in place.
 */

export default function ContentProvider({ children }) {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('id', 1)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.warn('[content] Supabase fetch failed, using bundled content:', error.message);
        return;
      }
      if (data?.content) setContent(data.content);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return children;
}
