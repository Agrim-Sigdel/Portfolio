# Supabase Admin/CMS — Setup Guide

This sets up the backend that powers the hidden `/admin` panel so you can log in
and edit all portfolio content, upload images, and read contact messages.

You do the **dashboard steps** below; the app code reads from what you create here.
Nothing here commits secrets — `.env.local` is gitignored (`*.local`).

Project ref: `wmzywhhrsapfhywdiyig`
URL: `https://wmzywhhrsapfhywdiyig.supabase.co`

---

## 1. Get your keys (Supabase → Project Settings → API)

Copy these into `.env.local` (already scaffolded for you):

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`  ← the ONLY key that ships to the browser (safe by design + RLS)
- **service_role key** → keep for the one-time seed script ONLY (step 5). Never put it in a `VITE_` var, never commit it, never ship it.

> ⚠️ The `database_pass` currently in `.env.local` is your Postgres password — the
> browser app never uses it. Keep it out of anything `VITE_`-prefixed. I left it
> but it isn't needed for the app.

---

## 2. Disable public signup (Auth → Providers → Email, or Auth → Settings)

Turn **OFF** "Allow new users to sign up". You are the only user. This makes
"any authenticated user = admin" true, which the RLS policies below rely on.

## 3. Create your admin user (Auth → Users → Add user)

Add a user with your email + a strong password, and mark **email confirmed**.
This is the login for `/admin`.

---

## 4. Run the schema (SQL Editor → New query → paste → Run)

> The canonical schema now lives as a migration:
> `supabase/migrations/20260725063857_init_admin_cms.sql` (tables + RLS **and**
> the storage bucket/policies from step 5). It's idempotent. If you use the CLI:
> `supabase link --project-ref wmzywhhrsapfhywdiyig && supabase db push`.
> If you already ran the SQL by hand, either run `supabase migration repair
> --status applied 20260725063857` to mark it applied, or just re-run it (safe).
> The SQL below is the same thing, for pasting into the dashboard.

```sql
-- ============================================================
-- site_content: single-row JSON document holding the whole tree
-- ============================================================
create table if not exists public.site_content (
  id          int primary key default 1,
  content     jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id),
  constraint site_content_singleton check (id = 1)
);

-- history: a snapshot per save, so the admin can undo/restore
create table if not exists public.content_history (
  id          bigint generated always as identity primary key,
  content     jsonb not null,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

-- contact messages from the public contact form
create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  status      text not null default 'new',   -- new | read | archived
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row-Level Security
-- Signup is disabled, so the only 'authenticated' user is you (admin).
-- ============================================================
alter table public.site_content    enable row level security;
alter table public.content_history enable row level security;
alter table public.contact_messages enable row level security;

-- site_content: world-readable, admin-writable
create policy "site_content public read"
  on public.site_content for select
  to anon, authenticated using (true);

create policy "site_content admin write"
  on public.site_content for all
  to authenticated using (true) with check (true);

-- content_history: admin-only
create policy "content_history admin read"
  on public.content_history for select
  to authenticated using (true);
create policy "content_history admin insert"
  on public.content_history for insert
  to authenticated with check (true);

-- contact_messages: anyone may submit (INSERT); only admin may read/update
create policy "contact insert anyone"
  on public.contact_messages for insert
  to anon, authenticated with check (true);
create policy "contact admin read"
  on public.contact_messages for select
  to authenticated using (true);
create policy "contact admin update"
  on public.contact_messages for update
  to authenticated using (true) with check (true);
```

---

## 5. Storage bucket for images (Storage → Create bucket)

- Name: `media`
- **Public** bucket: ON (so image URLs load on the site)

Then add write policies (SQL Editor):

```sql
-- public read is automatic for a public bucket; restrict writes to admin
create policy "media admin upload"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'media');
create policy "media admin update"
  on storage.objects for update
  to authenticated using (bucket_id = 'media');
create policy "media admin delete"
  on storage.objects for delete
  to authenticated using (bucket_id = 'media');
```

---

## 6. Seed the content row (one time, from the current site content)

Run locally — reads `src/data/content.json` and inserts it as row 1.
Uses the **service_role** key from your env, only on your machine, never committed:

```bash
SUPABASE_URL="https://wmzywhhrsapfhywdiyig.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<paste service_role key>" \
node scripts/seed-content.mjs
```

After it prints `Seeded site_content ✓`, the site reads content from Supabase
(with `content.json` as an offline/first-paint fallback).

---

## 7. Email notifications on contact submissions (Resend + Edge Function)

The contact form now writes to `contact_messages` (read it in the admin **Inbox**
tab). To also get an email per submission:

### 7a. Resend account
1. Sign up at **resend.com** (free tier).
2. Create an **API key** → copy it.
3. For real sending from your domain, add + verify your domain in Resend and use
   a sender like `Portfolio <noreply@agrimsigdel.com.np>`. For quick testing you
   can send from `onboarding@resend.dev` to the email you signed up with.

### 7b. Deploy the Edge Function (code is in `supabase/functions/notify-contact/`)
Install the Supabase CLI once (`brew install supabase/tap/supabase`), then:

```bash
supabase login
supabase link --project-ref wmzywhhrsapfhywdiyig

# Secrets: keep them in supabase/.env (gitignored) — copy supabase/.env.example,
# fill it in (generate WEBHOOK_SECRET with `openssl rand -hex 32`), then:
supabase secrets set --env-file supabase/.env

# ...or set them inline on one line instead of the env file:
# supabase secrets set RESEND_API_KEY="re_..." NOTIFY_TO="you@x.com" NOTIFY_FROM="onboarding@resend.dev" WEBHOOK_SECRET="..."

supabase functions deploy notify-contact
```

The function URL will be:
`https://wmzywhhrsapfhywdiyig.functions.supabase.co/notify-contact`

### 7c. Fire it on every insert (Database → Webhooks → Create)
- **Table:** `public.contact_messages`
- **Events:** Insert
- **Type:** HTTP Request → POST → the function URL above
- **HTTP Headers:** add `Authorization: Bearer <the same WEBHOOK_SECRET>`

Now a new contact message lands in the Inbox **and** emails you.
(Quick test: submit the contact form on the site, or insert a row in the table.)

---

## 8. Production deploy (Netlify)

`.env.local` is gitignored and never deploys, so the production build needs the
client vars set in the host. In **Netlify → Site settings → Environment variables**,
add:

- `VITE_SUPABASE_URL` = `https://wmzywhhrsapfhywdiyig.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = your anon key
- `VITE_SITE_URL` = `https://agrimsigdel.com.np`

Without these, the live site still works but falls back to the bundled
`content.json` and `/admin` shows "Admin unavailable". Redeploy after adding them.

Also, in **Supabase → Auth → URL Configuration**, add both redirect URLs:
`http://localhost:5173` (dev) and `https://agrimsigdel.com.np` (prod).

Keeping the offline fallback fresh: after big content edits, open the Content tab
in `/admin` → **Export JSON**, save it over `src/data/content.json`, and commit —
so the bundled seed doesn't drift far from the live DB.
