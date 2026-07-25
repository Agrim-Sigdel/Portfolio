/*
 * One-time seed: pushes src/data/content.json into the Supabase `site_content`
 * row (id = 1). Run locally with the service_role key — it bypasses RLS, so it
 * must never be committed or shipped.
 *
 *   SUPABASE_URL="https://<ref>.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="<service_role key>" \
 *   node scripts/seed-content.mjs
 *
 * Safe to re-run: it upserts row 1.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const contentPath = resolve(here, '../src/data/content.json');
const content = JSON.parse(await readFile(contentPath, 'utf8'));

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { error } = await supabase
  .from('site_content')
  .upsert({ id: 1, content, updated_at: new Date().toISOString() }, { onConflict: 'id' });

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log('Seeded site_content ✓');
