/*
 * Publishes src/data/content.json into the Supabase `site_content` row (id = 1),
 * which is what the live site reads. Safe to re-run: it upserts, and it snapshots
 * the current row into content_history first so a bad publish can be rolled back.
 *
 *   node scripts/seed-content.mjs            # publish
 *   node scripts/seed-content.mjs --dry-run  # show the diff, write nothing
 *
 * Credentials are read from .env.local (gitignored) — put them there rather than
 * on the command line, so the service_role key stays out of your shell history:
 *
 *   SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>
 *
 * VITE_SUPABASE_URL is accepted as a fallback for the URL, since it is the same
 * project. The key is not interchangeable: writes bypass row-level security, so
 * this needs the service_role (or `sb_secret_…`) key. The anon/publishable key
 * fails with "new row violates row-level security policy".
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dryRun = process.argv.includes('--dry-run');

/* Minimal .env reader — no dotenv dependency, and it must not clobber anything
   already exported in the shell. */
async function loadEnvFile(name) {
  try {
    const text = await readFile(resolve(root, name), 'utf8');
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#') || !t.includes('=')) continue;
      const i = t.indexOf('=');
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* absent is fine — the vars may come from the environment */
  }
}
await loadEnvFile('.env.local');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

/* Accept the spellings people actually reach for. Env names are case-sensitive,
   and the key gets called service_role, service key and secret key in different
   corners of the Supabase dashboard, so matching only one name turns a working
   setup into a "missing credentials" error. */
const KEY_ALIASES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SECRET_KEY',
  'supabase_service_role_key',
  'supabase_service_key',
  'supabase_secret_key',
];
const keyName = KEY_ALIASES.find((k) => (process.env[k] ?? '').trim());
const serviceKey = keyName ? process.env[keyName].trim() : undefined;

if (!url || !serviceKey) {
  console.error(
    'Missing credentials.\n' +
      'Add these to .env.local (they are gitignored):\n' +
      '  SUPABASE_URL=https://<ref>.supabase.co\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>\n' +
      'Dashboard → Project Settings → API → service_role (or Secret key).'
  );
  process.exit(1);
}

/* Guard against the mistake the error message doesn't explain: a legacy anon key
   is a JWT whose payload says role=anon. Catch it here rather than after a
   confusing RLS rejection from Postgres. */
const claimedRole = (() => {
  const parts = serviceKey.split('.');
  if (parts.length !== 3) return null; // sb_secret_… keys aren't JWTs
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString()).role ?? null;
  } catch {
    return null;
  }
})();

if (claimedRole && claimedRole !== 'service_role') {
  console.error(
    `${keyName} holds a "${claimedRole}" key, not service_role.\n` +
      'The anon/publishable key can read but not write — it fails RLS.\n' +
      'Dashboard → Project Settings → API → service_role (or Secret key).'
  );
  process.exit(1);
}

console.log(`Using ${keyName}${claimedRole ? ` (role: ${claimedRole})` : ' (non-JWT secret key)'}`);

const content = JSON.parse(await readFile(resolve(root, 'src/data/content.json'), 'utf8'));
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

/* ── what is about to change ─────────────────────────────────────────── */
const { data: currentRow, error: readErr } = await supabase
  .from('site_content')
  .select('content')
  .eq('id', 1)
  .maybeSingle();

if (readErr) {
  console.error('Could not read the current row:', readErr.message);
  process.exit(1);
}

const live = currentRow?.content ?? null;
const words = (t) => String(t ?? '').split(/\s+/).filter(Boolean).length;
const summarise = (tree) => {
  const ps = tree?.common?.projects ?? [];
  return {
    projects: ps.length,
    sections: ps.reduce((n, p) => n + (p.caseStudy?.sections?.length ?? 0), 0),
    words: ps.reduce(
      (n, p) => n + (p.caseStudy?.sections ?? []).reduce((m, s) => m + words(s.body), 0),
      0
    ),
    media: ps.reduce(
      (n, p) =>
        n +
        (p.caseStudy?.media?.length ?? 0) +
        (p.caseStudy?.sections ?? []).reduce((m, s) => m + (s.media?.length ?? 0), 0),
      0
    ),
  };
};

const before = live ? summarise(live) : null;
const after = summarise(content);
console.log('           projects  sections   words  media');
if (before) {
  console.log(
    `  live     ${String(before.projects).padStart(8)}${String(before.sections).padStart(10)}${String(before.words).padStart(8)}${String(before.media).padStart(7)}`
  );
}
console.log(
  `  publish  ${String(after.projects).padStart(8)}${String(after.sections).padStart(10)}${String(after.words).padStart(8)}${String(after.media).padStart(7)}`
);

/* Losing media is the one silently destructive outcome — a published gallery
   replaced by an empty array. Refuse rather than shrink it. */
if (before && after.media < before.media) {
  console.error(
    `\nRefusing to publish: media references would drop from ${before.media} to ${after.media}.\n` +
      'Uploaded images/videos live in the content tree, so publishing an older tree deletes them.\n' +
      'Re-export from /admin, or merge the live media into src/data/content.json first.'
  );
  process.exit(1);
}

if (dryRun) {
  console.log('\nDry run — nothing written.');
  process.exit(0);
}

/* ── snapshot, then publish ──────────────────────────────────────────── */
if (live) {
  const { error: histErr } = await supabase.from('content_history').insert({ content: live });
  if (histErr) console.warn('Warning: could not snapshot to content_history:', histErr.message);
  else console.log('\nSnapshotted the current row to content_history (undo trail).');
}

const { error } = await supabase
  .from('site_content')
  .upsert({ id: 1, content, updated_at: new Date().toISOString() }, { onConflict: 'id' });

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log('Seeded site_content ✓  — the live site now serves this content.');
