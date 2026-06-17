import { useCallback, useState } from 'react';

/*
 * useVisitedModes: remembers which modes the visitor has entered, persisted to
 * localStorage so the "explored" badges survive reloads and repeat visits.
 *
 * Returns the set of visited mode ids plus a `markVisited(id)` to record one.
 */

const KEY = 'ms-visited-modes';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function useVisitedModes() {
  const [visited, setVisited] = useState(() => new Set(read()));

  const markVisited = useCallback((id) => {
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        /* ignore storage failures */
      }
      return next;
    });
  }, []);

  return { visited, markVisited };
}
