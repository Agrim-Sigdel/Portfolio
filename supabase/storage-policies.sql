-- ============================================================
-- Storage RLS policies for the public `media` bucket
-- ============================================================
-- Creating the bucket is not enough. A public bucket gives public *reads*;
-- writes still go through row-level security on storage.objects. With RLS on
-- and a policy missing, uploads fail with:
--     new row violates row-level security policy
--
-- Safe to run repeatedly: every statement drops first, so it never errors with
-- 42710 "policy ... already exists". Run the whole file, or one block at a time.
--
-- Supabase dashboard → SQL Editor → paste → Run.


-- ── 1. What exists right now? ───────────────────────────────
-- Run this FIRST. You want three rows for storage.objects: INSERT, UPDATE and
-- DELETE, each with roles = {authenticated}. Anything missing is the bug.
--
-- Check `qual` (the USING clause) and `with_check` too — a policy can exist
-- under the right name while pointing at the wrong bucket or the wrong role.

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd;


-- ── 2. INSERT — creating a new object ───────────────────────
drop policy if exists "media admin upload" on storage.objects;
create policy "media admin upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');


-- ── 3. UPDATE — replacing an existing object ────────────────
-- REQUIRED, not optional. The app uploads with upsert enabled, so replacing a
-- file (the CV slot uses a fixed path) takes the update path. An INSERT policy
-- on its own passes for brand-new files and fails for replacements, which looks
-- like a random, intermittent RLS error.
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');


-- ── 4. DELETE — removing an object from the Media tab ───────
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');


-- ── 5. SELECT — listing objects in the admin Media tab ──────
-- Public-bucket reads over the public URL bypass RLS, but the admin's list()
-- call does not. Without this the Media tab silently shows an empty bucket.
drop policy if exists "media read" on storage.objects;
create policy "media read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');


-- ── 6. Verify ───────────────────────────────────────────────
-- Re-run the query from block 1. Expect four rows: SELECT, INSERT, UPDATE,
-- DELETE. Then retry the upload — policies apply immediately, no redeploy.
