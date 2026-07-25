/*
 * Pure helpers shared by the admin editor components.
 */

/** Read a dotted path ('common.personal.name') off an object; undefined-safe. */
export const getPath = (obj, path) =>
  path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

/** Immutably set a dotted path, cloning only the containers along the way. */
export const setPath = (obj, path, value) => {
  const keys = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cursor[k] = Array.isArray(cursor[k]) ? [...cursor[k]] : { ...cursor[k] };
    cursor = cursor[k];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
};

/** 'Feriaau CRM!' -> 'feriaau-crm' — mirrors the slugs already in content.json. */
export const slugify = (str) =>
  String(str ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Immutable array reorder; returns the same array when the move is a no-op. */
export const moveItem = (arr, from, to) => {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** Offer `obj` as a pretty-printed JSON download (refreshing the seed file). */
export const downloadJson = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
