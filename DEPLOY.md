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
      - Type **HTTP Request** (not "Supabase Edge Functions" — that type pre-fills
        an `Authorization` header with your anon key, which overwrites the secret
        below and makes the function 401 on every call)
      - POST → `https://wmzywhhrsapfhywdiyig.functions.supabase.co/notify-contact`
      - Header: `Authorization: Bearer <the same WEBHOOK_SECRET>`
      - Only ever **one** webhook on this table; edit the existing one rather than
        adding a second, or every message emails you twice.

> **Why `supabase/config.toml` matters.** Edge Functions default to
> `verify_jwt = true`, but this webhook authenticates with a shared secret, not a
> JWT. With the default on, Supabase's gateway returns 401 *before* the function
> runs — no email, and nothing obvious in the logs. `config.toml` sets
> `verify_jwt = false` for `notify-contact`; auth is still enforced by the
> function's own `WEBHOOK_SECRET` check. Always deploy from the repo root so that
> config is picked up — deploying without it silently re-enables JWT verification.

### A5b. Verifying the email path
- [ ] Function is actually deployed (a missing deploy 404s exactly like a typo'd name):
      ```bash
      supabase functions list --project-ref wmzywhhrsapfhywdiyig   # expect verify_jwt: false
      ```
- [ ] Test the function alone, bypassing the webhook:
      ```bash
      curl -i -X POST https://wmzywhhrsapfhywdiyig.functions.supabase.co/notify-contact \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $(grep '^WEBHOOK_SECRET=' supabase/.env | cut -d= -f2)" \
        -d '{"record":{"name":"Test","email":"you@example.com","message":"hello"}}'
      ```
      `{"ok":true}` = function + Resend fine. Plain `Unauthorized` = secret mismatch.
      A *JSON* 401 about a JWT = `verify_jwt` is still on.
- [ ] Test the whole chain by inserting as an anonymous visitor would:
      ```bash
      curl -i -X POST "$VITE_SUPABASE_URL/rest/v1/contact_messages" \
        -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"name":"E2E","email":"you@example.com","message":"end to end"}'
      ```
      Expect `201`. If the function test passed but no email arrives from this,
      the webhook is missing, disabled, or carrying a stale secret.
      (Don't add `Prefer: return=representation` — that also demands a SELECT
      policy, which anon deliberately lacks, so it fails with a misleading RLS
      error even when inserts are perfectly healthy.)
- [ ] If `NOTIFY_FROM` is `onboarding@resend.dev`, Resend only delivers to the
      address that owns the Resend account. Sending anywhere else returns success
      but never arrives — verify a domain and use `noreply@agrimsigdel.com.np` for
      real use.

### A6. Replying and composing from the admin inbox
- [ ] Apply both mail migrations (`supabase db push`, or paste each into the SQL Editor):
      - `20260725190000_contact_replies.sql` — `contact_replies` + `contact_messages.replied_at`.
        Until it runs, replies send but aren't logged and no "Replied" badge appears.
      - `20260725200000_compose_outbound.sql` — makes `contact_replies.message_id`
        nullable so composed mail (which answers no incoming message) can be logged.
        Until it runs, composing still sends but is missing from the log.
- [ ] Inbox has two paths, both through `send-reply`:
      **Reply** on a message (recipient comes from the row) and **New message**
      (recipient comes from the form, validated as a single address).
- [ ] `REPLY_FROM` is set and `agrimsigdel.com.np` is **verified** in Resend
      (Resend → Domains → status `verified`, sending `enabled`).
- [ ] Deploy the function: `supabase functions deploy send-reply`

> **Sending is not receiving.** Replies go *out* from `contact@agrimsigdel.com.np`,
> and when someone hits reply it lands wherever that address's MX records point —
> Resend does not host a mailbox for you. Its inbound feature is `disabled` on this
> domain. If you want mail *to* `contact@…` to actually arrive somewhere, point MX
> at a real provider (Gmail/Fastmail/Zoho) or enable Resend Inbound separately.

> **Why send-reply doesn't rely on `verify_jwt`.** The anon key is itself a valid
> JWT and ships publicly in the bundle, so gateway verification alone would expose
> a mailer that sends as your domain — an open spam relay. The function resolves
> the caller against `/auth/v1/user` and requires a real account. It also reads the
> recipient from the `contact_messages` row rather than the request body, so it can
> only ever reply to someone who actually wrote in.

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
