# Go-Live Checklist

Everything you need to do to take the Supabase admin/CMS live. Work top to bottom.
Tick each box. Some may already be done — verify anyway.

- **Supabase project ref:** `wmzywhhrsapfhywdiyig`
- **Supabase URL:** `https://wmzywhhrsapfhywdiyig.supabase.co`
- **Site:** `https://agrimsigdel.com.np`
- Full detail for any step is in [SETUP.md](SETUP.md).

---

## A. Supabase (dashboard + CLI)

### A1. Auth
- [ ] **Auth → Providers/Settings:** turn **OFF** "Allow new users to sign up".
      (You're the only user; this makes "any logged-in user = admin" true.)
- [ ] **Auth → Users → Add user:** create your admin (email + strong password,
      mark **email confirmed**). This is your `/admin` login.
- [ ] **Auth → URL Configuration → Redirect URLs:** add both
      - `http://localhost:5173`
      - `https://agrimsigdel.com.np`

### A2. Database schema
- [ ] Apply the schema. Either:
      - **CLI:** `supabase link --project-ref wmzywhhrsapfhywdiyig && supabase db push`, or
      - **Dashboard:** paste [SETUP.md](SETUP.md) step 4 SQL into the SQL Editor and Run.
      - *(If you already ran it by hand: `supabase migration repair --status applied 20260725063857`.)*
- [ ] Confirm 3 tables exist: `site_content`, `content_history`, `contact_messages`.

### A3. Storage
- [ ] **Storage → Create bucket:** name `media`, **Public = ON**.
- [ ] Storage write policies applied (part of the schema/migration, or SETUP.md step 5).

### A4. Seed content (one time)
- [ ] Run the seed so `site_content` has row 1:
      ```bash
      SUPABASE_URL="https://wmzywhhrsapfhywdiyig.supabase.co" \
      SUPABASE_SERVICE_ROLE_KEY="<service_role / sb_secret key>" \
      node scripts/seed-content.mjs
      ```
      Expect `Seeded site_content ✓`. (Use the **service_role** key, not anon/publishable.)

### A5. Email notifications (Resend + Edge Function)
- [ ] Create a **Resend** account → get an API key. **Rotate the old exposed key.**
- [ ] Fill secrets in `supabase/.env` (copy from `supabase/.env.example`):
      - `RESEND_API_KEY` (the new one)
      - `NOTIFY_TO` (your inbox)
      - `NOTIFY_FROM` (`onboarding@resend.dev` for testing, or a verified domain sender)
      - `WEBHOOK_SECRET` (generate: `openssl rand -hex 32`)
- [ ] Push secrets + deploy:
      ```bash
      supabase secrets set --env-file supabase/.env
      supabase functions deploy notify-contact
      ```
- [ ] **Database → Webhooks → Create:**
      - Table `public.contact_messages`, event **Insert**
      - POST → `https://wmzywhhrsapfhywdiyig.functions.supabase.co/notify-contact`
      - Header: `Authorization: Bearer <the same WEBHOOK_SECRET>`

---

## B. Netlify (dashboard)

### B1. Environment variables  ← REQUIRED, or live /admin won't work
- [ ] **Site settings → Environment variables**, add:
      - `VITE_SUPABASE_URL` = `https://wmzywhhrsapfhywdiyig.supabase.co`
      - `VITE_SUPABASE_ANON_KEY` = your **anon** key
      - `VITE_SITE_URL` = `https://agrimsigdel.com.np`
- [ ] (These are safe to expose — RLS enforces access. Never add the Resend or
      service_role key here.)
- [ ] Netlify's secrets scanner fails the build when it finds these three in
      `dist/` (Vite inlines every `VITE_` var into the bundle). `netlify.toml`
      already allows exactly those three via `SECRETS_SCAN_OMIT_KEYS` under
      `[build.environment]`. If you add another `VITE_` var later, add it to
      that list too — and only if it's genuinely safe to publish.

### B2. Forms (cleanup)
- [ ] Contact now goes through Supabase, so the old **Netlify Forms** entry is
      unused. Ignore it, or remove/disable form notifications in **Forms**.
      (Build settings and the SPA redirect in `netlify.toml` stay as-is.)

---

## C. Ship it

- [ ] Merge `feat/supabase-admin-cms` → `main` (open the PR link from the push, or
      fast-forward locally). Merging triggers the Netlify production deploy.
- [ ] After deploy, smoke test on the live site:
      - [ ] `/cv` and `/normal` render your content
      - [ ] `/admin` → log in → edit a field → **Publish** → change shows on the site
      - [ ] **Media** tab: upload an image, copy URL
      - [ ] Submit the contact form → appears in **Inbox** → email arrives

---

## Secret hygiene (reminder)
| Key | Where it goes | Never |
|---|---|---|
| anon key, Supabase URL, site URL | `.env.local` + Netlify env (VITE_*) | — |
| Resend / service_role / DB password | `supabase/.env` + `supabase secrets set` | never `VITE_`, never Netlify, never committed |

`.env.local` and `supabase/.env` are gitignored; only `*.example` templates are committed.
