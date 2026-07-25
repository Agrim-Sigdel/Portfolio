import { useSyncExternalStore } from 'react';
import seed from '../../data/content.json';

/*
 * contentStore: the single source of truth for editable site content at runtime.
 *
 * Why a store and not just a Context?  Most consumers are React components and
 * could use a hook, but a few are plain modules called on demand — the résumé
 * PDF generator, the terminal VFS builder, the derived portfolioData helpers.
 * Those can't call hooks. A tiny external store lets *components* subscribe
 * reactively via `useContent()` while *modules* read the latest snapshot via
 * `getContent()` — both see the same live value.
 *
 * Flow: the app boots with the baked-in `content.json` (instant first paint,
 * works offline), then ContentProvider fetches the latest from Supabase and
 * calls `setContent()` to swap it in (stale-while-revalidate).
 */

let current = seed;
const listeners = new Set();

/** Latest content tree. Safe to call from non-React modules. */
export const getContent = () => current;

/** The compiled-in default; also the fallback when Supabase is unreachable. */
export const getSeedContent = () => seed;

/** Replace the live content and notify subscribers. Ignores null/undefined. */
export const setContent = (next) => {
  if (!next || next === current) return;
  current = next;
  listeners.forEach((fn) => fn());
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Reactive hook for components — re-renders when content changes. */
export const useContent = () => useSyncExternalStore(subscribe, getContent, getSeedContent);
