-- Admin/CMS schema for the portfolio: editable content, history, contact
-- messages, and the media storage bucket + policies.
--
-- Idempotent on purpose: the schema was first applied by hand in the dashboard,
-- so every object is guarded (create ... if not exists / drop policy if exists)
-- and this migration can be applied to that existing database without error.
--
-- Access model: public signup is DISABLED in Auth settings, so the only
-- `authenticated` user is the hand-created admin — hence "authenticated" == admin.

-- ============================================================ tables
create table if not exists public.site_content (
  id          int primary key default 1,
  content     jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id),
  constraint site_content_singleton check (id = 1)
);

create table if not exists public.content_history (
  id          bigint generated always as identity primary key,
  content     jsonb not null,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  status      text not null default 'new',   -- new | read | archived
  created_at  timestamptz not null default now()
);

-- ============================================================ RLS
alter table public.site_content     enable row level security;
alter table public.content_history  enable row level security;
alter table public.contact_messages enable row level security;

-- site_content: world-readable, admin-writable
drop policy if exists "site_content public read" on public.site_content;
create policy "site_content public read"
  on public.site_content for select
  to anon, authenticated using (true);

drop policy if exists "site_content admin write" on public.site_content;
create policy "site_content admin write"
  on public.site_content for all
  to authenticated using (true) with check (true);

-- content_history: admin-only
drop policy if exists "content_history admin read" on public.content_history;
create policy "content_history admin read"
  on public.content_history for select
  to authenticated using (true);

drop policy if exists "content_history admin insert" on public.content_history;
create policy "content_history admin insert"
  on public.content_history for insert
  to authenticated with check (true);

-- contact_messages: anyone may submit; only admin may read/update
drop policy if exists "contact insert anyone" on public.contact_messages;
create policy "contact insert anyone"
  on public.contact_messages for insert
  to anon, authenticated with check (true);

drop policy if exists "contact admin read" on public.contact_messages;
create policy "contact admin read"
  on public.contact_messages for select
  to authenticated using (true);

drop policy if exists "contact admin update" on public.contact_messages;
create policy "contact admin update"
  on public.contact_messages for update
  to authenticated using (true) with check (true);

-- ============================================================ storage
-- Public `media` bucket for uploaded images / the CV file.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Public read is automatic for a public bucket; restrict writes to admin.
drop policy if exists "media admin upload" on storage.objects;
create policy "media admin upload"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'media');

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update"
  on storage.objects for update
  to authenticated using (bucket_id = 'media');

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete"
  on storage.objects for delete
  to authenticated using (bucket_id = 'media');
