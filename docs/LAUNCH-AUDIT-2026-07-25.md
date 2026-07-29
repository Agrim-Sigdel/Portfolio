# Pre-launch audit — 2026-07-25

Full-codebase audit run against `feat/contact-email-replies` @ `dc62229` (clean tree).
Ten specialist sweeps + independent adversarial verification of each finding.

**Verdict: do not launch until the P0 list below is clear.** One finding is a live
security hole in production, three more are visibly broken for ordinary visitors, and
two are one-line credibility fixes.

Status legend used throughout:

| Tag | Meaning |
|---|---|
| ✅ **verified** | A second agent independently read the code, tried to refute the claim, and could not. |
| ⚠️ **unverified** | Reported by one sweep, never independently re-checked. Mechanism is plausible; treat details as unchecked. |
| ❌ **refuted** | Filed, then disproved. Recorded so it doesn't get re-litigated. |

Baseline at audit time: `npm run build` **passes** (1177 modules, 3.8 s).
`npm run lint` **fails with 17 errors — 14 of them false positives** (see [L1](#l1)).

---

## Table of contents

- [P0 — ship blockers](#p0--ship-blockers)
- [P1 — data loss and broken behaviour](#p1--data-loss-and-broken-behaviour)
- [P2 — real defects, not blockers](#p2--real-defects-not-blockers)
- [P3 — polish, hygiene, doc drift](#p3--polish-hygiene-doc-drift)
- [Explicitly refuted — do not re-file](#explicitly-refuted--do-not-re-file)
- [Fix order](#fix-order)
- [Coverage and limitations](#coverage-and-limitations)
- [How this audit was run](#how-this-audit-was-run)

---

## P0 — ship blockers

### P0-1 ✅ Any authenticated user is the admin, and signup is enabled in production

`supabase/migrations/20260725063857_init_admin_cms.sql:48-100` ·
`supabase/functions/send-reply/index.ts:78`

Every RLS policy and the `send-reply` auth gate authorize on `role = 'authenticated'`.
Nothing anywhere pins access to a UID — a grep for `auth.uid|admins|admin_user_id`
across all `*.js/jsx/ts/sql/toml/mjs` returns **zero** authorization hits.

An agent queried the live project: `GET /auth/v1/settings` returns
`"disable_signup": false`. So the attack is: scrape the anon key from the public
bundle → `supabase.auth.signUp()` → confirm at an address you control → you are the
admin.

What that grants:

| Policy | Line | Grants |
|---|---|---|
| `site_content admin write` (`for all`) | :48-51 | UPDATE/DELETE row 1 — the whole website |
| `content_history` read/insert | :55-62 | full history read/write |
| `contact admin read` | :71-73 | every submitter's name, email, phone, message — third-party PII |
| `contact admin update` | :76-78 | rewrite any message row |
| `media` upload/update/delete | :88-100 | gated only on `bucket_id = 'media'` — host arbitrary files on your domain, replace the CV |
| `contact_replies` read | `20260725190000_contact_replies.sql:30-32` | your entire outbound mail log |
| `send-reply` gate | `send-reply/index.ts:78` | **send arbitrary HTML mail as `contact@agrimsigdel.com.np`** — a phishing relay on your verified Resend domain |

CORS is not a defence: `ALLOWED_ORIGINS` (`send-reply/index.ts:36-50`) only shapes the
response header, `:46` falls back to `ALLOWED_ORIGINS[0]` and never rejects, and
server-side callers ignore CORS entirely.

`DEPLOY.md:16-17` already prescribes turning signup off — it just wasn't done, and
step A1 has no verification command (A5b does, which is why this gap went unnoticed).

**Fix, in order:**

1. **Today, one click.** Dashboard → Authentication → Sign In/Providers → Email →
   uncheck *Allow new users to sign up*. Then verify:
   ```bash
   curl -s -H "apikey: $VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_URL/auth/v1/settings"
   # must show "disable_signup": true
   ```
   Confirm `auth.users` has exactly one row. Add that curl to `DEPLOY.md` A1.
2. **Stop the role being the authorization decision.** New migration:
   ```sql
   create function public.is_admin() returns boolean
     language sql stable security definer set search_path = '' as $$
     select auth.uid() = '<admin-uuid>'::uuid $$;
   ```
   Rewrite all nine policies to `using (public.is_admin())`. On the `for all` policy
   at :49-51 put it in **both** `using` and `with check`, or inserts stay open. Apply
   to all three `storage.objects` policies at :88-100 too. If you prefer an `admins`
   table, it must have RLS on with no anon/authenticated SELECT policy, or a signed-in
   stranger can enumerate it.
3. **`send-reply/index.ts:78`** — add an `ADMIN_USER_ID` function secret and require
   `user.id === Deno.env.get("ADMIN_USER_ID")`; also reject `user.is_anonymous`.
   Keep the existing role test. This is the check that closes the mail relay.
4. **Fix the comments that assert a property production contradicts:**
   `init_admin_cms.sql:8-9`, `SETUP.md:28-31` and `:83`, `AdminLogin.jsx:7`.

Accuracy notes: `mailer_autoconfirm` is `false`, so the attacker must click a
confirmation link first — seconds of friction, not a control. All OAuth/phone/passkey/
SAML providers are `false`, and `anonymous_users` is `false` today, so the
`is_anonymous` guard is future-proofing rather than present risk.

### P0-2 ✅ The service worker serves the app shell instead of your PDFs

`vite.config.js:39`

`navigateFallback: '/index.html'` with no `navigateFallbackDenylist`. Workbox registers
a NavigationRoute with the default allowlist `[/./]`, so **every** same-origin
navigation — including to real files — is answered from precached `index.html`.

Confirmed in the shipped worker: `dist/sw.js` ends with
`new s.NavigationRoute(s.createHandlerBoundToURL("/index.html"))` — no options object.
The matcher in `dist/workbox-*.js` is `{allowlist:[/./],denylist:[]}` and tests
`pathname + search`.

Failure: a repeat visitor runs `open ~/resume.pdf` in the terminal
(`vfs.js:174` → `CommandParser.jsx:413` → `Terminal.jsx:548`) or clicks "View Paper"
on `/cv` (`NormalModeLayout.jsx:139-146` → `/CATD-Submission.pdf`) and gets a new tab
booting the portfolio, which `App.jsx:73` bounces to `/`. `skipWaiting` +
`clientsClaim` mean even a first-time visitor is intercepted after a moment. Netlify's
`/*` redirect is `status = 200`, so the CDN *would* serve the real file — the breakage
only exists when the SW is in control, which is why a fresh-profile smoke test misses it.

```js
navigateFallback: '/index.html',
// Real files in public/ must not be answered from the app shell.
// Patterns match url.pathname + url.search.
navigateFallbackDenylist: [
  /\.(?:pdf|txt|md|xml|json|png|jpe?g|svg|ico|webmanifest)(?:\?.*)?$/i,
],
```

The query-string tolerance matters — `?utm_source=linkedin` is exactly how a résumé
link gets shared. No SPA route has a dot in its last segment, so offline deep links are
unaffected. Existing visitors self-heal: `registerType: 'autoUpdate'` plus
`max-age=0, must-revalidate` on `/sw.js`.

**Verify:** rebuild, confirm `dist/sw.js` constructs the NavigationRoute with a second
argument containing `denylist:[`, then with the new SW *activated* test both paths.

### P0-3 ✅ Light-theme blanket rules make buttons unreadable on `/cv` and `/normal`

`src/shared/styles/theme.css:92` (and `:84`)

```css
[data-theme="light"] button:hover { background-color: #e5e5e5; }
```

Specificity (0,2,1) outranks every component's own `.class:hover` at (0,2,0). The
components keep `color: #fff`, so labels vanish at **~1.08–1.26:1**.

`ThemeContext.jsx:11` defaults to `'light'` and `MODE_THEME.fun = null`, so first-time
visitors hit this on `/normal` too — not just `/cv`, which is forced light by
`App.jsx:35`.

Affected: `.cv-return-button` (`normal-mode.css:48`), `.cv-contact-cta` (`:387` — the
primary contact CTA), `.cv-contactform-submit` (`:349`), `.cf-submit`
(`ContactForm.css:80` — its hover sets only transform/shadow, so the red CTA turns
grey), `.navbar-theme-toggle` (`Navbar.css:130` — white icon on grey, **1.08:1**, and
it's the one control that gets a visitor out of light theme). Only
`.tcf-submit:hover:not(:disabled)` at (0,3,0) survives. `/admin` is **not** affected
(`.admin-btn-primary:hover` is (0,3,0)).

Load order cuts the wrong way: component rules land in the lazy
`NormalModePage-*.css`, injected after the eager `index-*.css` that carries the blanket
rule.

**Fix:** delete `theme.css:92-94` outright — every styled button defines its own hover
treatment, so nothing regresses. Do **not** substitute `:where(button)`: still (0,2,0),
which beats `.cf-submit`'s base `background: var(--accent-red)` at (0,1,0).

Same pass, separate defect: `[data-theme="light"] a { color: #dc2626 }` at
`theme.css:84-86` overrides `.cv-download-button { color: #fff }`
(`normal-mode.css:73`) because `DownloadButton` renders an `<a>`
(`DownloadButton.jsx:87`) — the "Download cv" pill ships a red label on `#1a1a1a`
(~3.6:1, fails AA at 0.85rem) and `#991b1b` on `#000` on hover (~2.5:1). Scope those
two rules to prose containers rather than every anchor.

**Needs manual hover testing** — cannot be done blind.

### P0-4 ✅ All nine case studies label themselves "Work in progress"

`src/pages/caseStudy/CaseStudyPage.jsx:36`

```js
const isWip = caseStudy.wip !== false;
```

The key `wip` exists **nowhere** — not in `content.json`, not in the DB
(`seed-content.mjs:27` copies the JSON wholesale), and there is no `/admin` control.
All nine projects render the amber banner above the title, each carrying 4-6 finished
prose sections. `:38-40` chains prev/next across all nine, so one click walks a
recruiter through nine consecutive self-disclaimers.

**Fix:** invert the default in code — this clears production in one step and is immune
to the Supabase row overwriting the seed:

```js
// Case studies are live by default; flag a genuine draft with `wip: true`.
const isWip = caseStudy.wip === true;
```

Do **not** instead set `"wip": false` in `content.json` alone —
`ContentProvider.jsx:32` replaces the seed after mount, so the banner would be absent
on first paint and pop in a beat later.

Then make it reachable: a checkbox after the Role field at `ProjectsEditor.jsx:112`,
bound `checked={cs.wip === true}`. There's no reusable boolean field in `fields.jsx` —
copy the inline checkbox pattern at `fields.jsx:98`. Add `wip: false` to
`emptyCaseStudy()` at `ProjectsEditor.jsx:21-27`.

### P0-5 ✅ Social cards render with no image

`index.html:33` and `:38`

`og:image` and `twitter:image` are root-relative `/og-image.png` while `og:url` (`:32`)
and `<link rel="canonical">` (`:27`) are already absolute. LinkedIn, Slack and Discord
drop it. (Facebook and X do resolve relative values against the document URL, so
"no platform renders a card" overstates it — but this is your highest-visibility launch
asset.)

Nothing rescues it: `dist/index.html` still reads `content="/og-image.png"`, there's no
prerenderer, and `SEO.jsx` can't help — it's a client-only `useEffect` crawlers never
run, and every call site omits `image` anyway.

```html
<meta property="og:image" content="https://agrimsigdel.com.np/og-image.png" />
<meta name="twitter:image" content="https://agrimsigdel.com.np/og-image.png" />
```

The asset is **460×460** (verified via PNG IHDR), so either re-export at 1200×630 and
then declare `og:image:width/height`, or change `index.html:35` to
`twitter:card="summary"` for an intentional square. Don't declare 1200/630 against the
current file.

**Cache note:** `netlify.toml` only sets `Cache-Control` for `/assets/*`, and social
platforms cache scraped images for days. If you regenerate in place, rename the file or
force a re-scrape via the Facebook Sharing Debugger and LinkedIn Post Inspector.

### P0-6 ✅ Research section contradicts itself on a credential

`src/pages/funMode/sections/Research.jsx:63`

The hardcoded `<h2>` reads "Peer-reviewed **science**." while the section's only entry
is badged ~4rem below it, "SUBMITTED FOR PEER REVIEW" (`content.json:89`, repeated on
`/cv` at `NormalModeLayout.jsx:117`). Every other surface is honest (`cv.txt:42`,
`generateResumePdf.js:190`), which makes this lone outlier read as a deliberate
overclaim to exactly the audience that would check.

**Fix:** reword to something status-agnostic — the eyebrow at `:60` already says
"Research & Publications", so the `<h2>` needn't carry a credential claim. Do not
interpolate `r.status` ("Submitted for peer review science.").

---

## P1 — data loss and broken behaviour

### P1-1 ✅ Switching admin tabs discards every unsaved content edit

`src/pages/admin/AdminShell.jsx:52`

Owner edits several sections (the "Unsaved changes" pill is showing), clicks **Inbox**
to check a message or **Media** to grab an image URL — `ContentEditor` unmounts and all
of it is gone, with no warning. Clicking **Content** again shows the last-published tree.

**Fix:** keep only `ContentEditor` mounted-but-hidden. Do *not* mount all three — the
other two have mount side effects that must stay lazy (`ContactInbox.jsx:149-158`
auto-marks messages read; `:129` and `MediaPanel.jsx:43` fetch on mount).

```jsx
<main className="admin-main">
  <div style={{ display: tab === 'content' ? undefined : 'none' }}>
    <ContentEditor onDirtyChange={setContentDirty} />
  </div>
  {tab === 'inbox' && <ContactInbox />}
  {tab === 'media' && <MediaPanel />}
</main>
```

### P1-2 ✅ Publish is a blind last-write-wins upsert with no restore path

`src/pages/admin/adminContent.js:47`

Owner leaves `/admin` open on the laptop, fixes a typo from their phone and publishes,
then that evening tweaks one field on the laptop and hits Publish — the morning
snapshot silently reverts the phone's change. The `content_history` insert is also
unchecked, so a failed snapshot leaves no record, and there is no restore UI.

**Fix:** keep the upsert (it must still create row 1 on a fresh DB) and add a conflict
check using the SELECT that already runs — `loadContent` returns `updated_at`,
`ContentEditor` holds it in a ref, `publishContent(next, loadedAt)` re-reads
`content, updated_at` (checking *that* read's error, currently discarded) and refuses
if it moved. Surface "someone else published since you loaded — reload?".

### P1-3 ✅ The global focus ring is invisible on every filled button

`src/index.css:288`

The focus outline is `currentColor`. On filled buttons the text is white, so the ring
is white-on-white/white-on-grey — **1.00–1.21:1**. Tab through `/cv` — "Back to Start",
"Download cv", header links, "Send a message", modal "Send message" — and nothing
changes visually. A keyboard-only visitor cannot tell where focus is.

```css
:root { --focus-ring: #1a1a1a; }
:where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

`#1a1a1a` gives 14.1:1 on the `.cv-mode` background and 17.1:1 on the white paper and
modal panel. Keep `outline` as the mechanism — never `box-shadow` in a global rule.

### P1-4 ✅ `var(--accent, #ff4c2b)` — `--accent` is never defined anywhere

`src/pages/funMode/sections/WorkGrid.jsx:78`

The token doesn't exist, so the fallback orange is what always renders: the
"READ CASE STUDY" button is white 12.8 px bold on orange at **3.32:1**, and the status
pill (`:42`), project link pills (`:107`), employer pills (`Experience.jsx:91`) and
paper/GitHub pills (`Research.jsx:24`) render orange 10–14 px text on near-white at
**3.17:1**. All fail AA.

**Fix:** switch those to `var(--accent-red)` and set the CTA label to
`var(--fun-bg, #071011)` — keeping `#fff` would give 1.49:1 against the dark-mode mint.

### P1-5 ✅ Fun-mode form errors are unreadable in the default light theme

`src/pages/funMode/sections/ContactForm.css:98`

A visitor submits the contact form empty; four validation messages render as pale
salmon on white at **2.55:1**. The submit is silently blocked
(`ContactForm.jsx:85-88`), so the form just looks broken and the enquiry is lost.

```css
[data-theme='light'] .cf-error { color: #b3261e; }   /* 6.54:1 on #ffffff */
```

Dark mode is fine (7.09:1) and needs no change.

### P1-6 ✅ Nothing can be copied out of the terminal

`src/features/terminalMode/ui/Terminal.jsx:524`

A recruiter runs `cat ~/contact.txt`, drags across the email address to copy it — on
mouseup the container's `onClick` (`:801`) refocuses the hidden input, the highlight
disappears, and the clipboard gets nothing. Same for every project URL printed by
`cat ~/projects/*.md`: not a link, not selectable, therefore unreachable.

```js
const handleTerminalClick = () => {
  if (isTouch || showMenu || windowState !== 'open') return;
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed && sel.toString().trim()) return; // keep drag-selections
  inputRef.current?.focus();
};
```

### P1-7 ✅ The contact modal steals focus out of the field being typed in

`src/shared/ui/ContactModal.jsx:73`

The setup effect depends on `[open, onClose]`, and every caller passes a fresh inline
arrow (`Terminal.jsx:787`/`:1081`, `ModeTriptych.jsx:203`, `NormalModeLayout.jsx:220`).
Any parent re-render tears the effect down and re-runs it: cleanup restores focus to
the previous element, then setup re-arms the 60 ms timer that force-focuses the first
field.

Concrete trigger: on `/terminal`, `fx auto` shuffles every 8 s (`fxStore.js:185`) and
`Terminal.jsx:517` subscribes, so Terminal re-renders on a timer. A visitor typing a
message has their caret yanked to the **Name** field mid-sentence, every 8 seconds.
The same fires on `/` and `/normal` if content hydration lands after the modal opens.

**Fix:** hold `onClose` in a ref and key the effect on `[open]` alone.

### P1-8 ✅ A Supabase-hosted CV breaks the download button

`src/shared/ui/DownloadButton.jsx:20`

The HTML `download` attribute is ignored cross-origin. Once the owner uploads a CV via
`/admin` (`MediaManager.jsx:36` stores a `https://<ref>.supabase.co/...` URL), clicking
"Download cv" navigates the current tab to the PDF instead of saving it — the portfolio
is replaced by the browser's PDF viewer while the button animates "Downloading… →
Downloaded" on a page that no longer exists. Works today only because the fallback is
same-origin; it breaks the first time the CMS is used for its stated purpose.

**Fix (server-side, primary):** `getPublicUrl(name, { download: 'Agrim Sigdel
Resume.pdf' })` in `adminMedia.js:21`, requested from `MediaManager.jsx:36`. Supabase
then sends `Content-Disposition: attachment`, which browsers honour cross-origin.
Secondary: in `DownloadButton`, when the origin differs, `fetch → blob → objectURL`.

### P1-9 ✅ Empty education array crashes `/normal` with no recovery

`src/pages/funMode/sections/About.jsx:44`

`{common.education[0].degree}` is unguarded. `/admin`'s `ObjectListEditor` can delete
the last row (`fields.jsx:171-175`) and `validate.js:52-54` only does `forEach`, so
zero entries publishes clean. `/normal` paints the seed for one frame, hydration swaps
in the bad tree, `About` throws, and `ErrorBoundary` offers only
`window.location.reload()` — which refetches the same poisoned row forever.

**Fix:** `const edu = common.education?.[0];` and wrap the whole block at `:41-47` —
guarding only the `<p>` leaves an orphan heading. Same class at
`NormalModeLayout.jsx:191-201` (the `map` is empty-safe but the `<h2>` is
unconditional). Do **not** add a min-1 rule to `validate.js`; zero education entries is
a legitimate editorial state and every other consumer is already empty-safe.

Separately, give `ErrorBoundary` a second action that calls
`setContent(getSeedContent())` so any content-shaped crash is recoverable by the
visitor instead of terminal.

### P1-10 ✅ Case-study deep links break two different ways

`src/pages/caseStudy/CaseStudyPage.jsx:30` — `if (!project || !project.caseStudy)`

Both halves are defective, for different inputs:

- **New slug → redirect.** `getProjectBySlug` reads `getContent()`, which on first
  render is still the bundled seed (`ContentProvider` hydrates in an effect and renders
  children unconditionally). A project added in `/admin` and published — no redeploy,
  the whole point of the CMS — deep-links to `<Navigate to="/normal" replace />`, so
  the recipient lands at the top of fun mode with no message and, because of `replace`,
  no working Back. Clicking through from the work grid works after hydration, which
  makes it look intermittent.
- **Blank case study → live empty page.** `emptyCaseStudy()`
  (`ProjectsEditor.jsx:20-26`) returns a **truthy** object, so the guard doesn't fire
  and `WorkGrid.jsx:63` renders a "Read case study" link to a page with a top bar, the
  WIP banner, a title and prev/next arrows — no tagline, role, stack or prose.

**Fix:** add a settled flag to `contentStore`, set it in **all four** terminal paths of
`ContentProvider` (`!isSupabaseConfigured` early return, error branch, falsy
`data?.content`, success) plus a ~2.5 s timeout, and gate in `CaseStudyRoute` where
`ModeLoader` is already in scope. Then gate on *content*, not presence:
`const hasCaseStudy = cs?.sections?.length > 0` in `CaseStudyPage.jsx:30`,
`WorkGrid.jsx:63` and `NormalModeLayout.jsx:174`. Replace the redirect with a real
not-found panel so the URL survives a refresh.

Nothing shipped today is broken — all nine current slugs are in the bundle. The blast
radius is content published after the last deploy.

---

## P2 — real defects, not blockers

### Admin CMS

| # | Where | Defect |
|---|---|---|
| P2-1 ✅ | `MediaManager.jsx:35` | CV upload replaces the file live visitors download **before** (and even without) publishing. Version by filename — keep the bucket flat, since `listMedia()` filters out folder placeholders and prefixed objects would be invisible and undeletable in the Media panel. |
| P2-2 ✅ | `MediaPanel.jsx:64` | Filenames are slugged then uploaded with `upsert: true`, so `Paper V2.pdf` silently replaces `paper-v2.pdf` — published links now serve the wrong document, no warning, no versioning. Guard with a name-clash `confirm()` before upload. |
| P2-3 ✅ | `MediaPanel.jsx:70` | An oversize-file rejection is overwritten with "Uploaded." — a failed upload reports success. |
| P2-4 ✅ | `validate.js:11` | A completely blank link publishes, rendering an empty `<a href="">` chip that reloads the page on click. Two blanks also trigger duplicate-key warnings (`WorkGrid.jsx:91`, `Experience.jsx:76` key on `link.url`). |
| P2-5 ✅ | `ContactInbox.jsx:190`, `:220` | The "Sent" confirmation is overwritten by the reload in the same batch, so it never renders. Owner can't tell whether the mail went and sends twice. Thread a `quiet` flag through both loaders. |
| P2-6 ✅ | `ProjectsEditor.jsx:73` | The slug field re-slugifies on every keystroke, so hand-typing `crm-rebuild` stores `crmrebuild`. It passes `SLUG_RE` and publishes to the wrong URL. |
| P2-7 ⚠️ | `ContactInbox.jsx:129` | Filter loads aren't sequenced — a stale response can populate the wrong tab. |
| P2-8 ⚠️ | `ContactInbox.jsx:100` | No pagination; `.range(0, 49)` + "load more" needed, and `admin.css:484` needs `max-height`/`overflow` — one multi-MB message body blows out the page today. |

### Terminal mode

| # | Where | Defect |
|---|---|---|
| P2-9 ✅ | `fxStore.js:234` | `fx auto` calls `pullToShader()` on every shuffle, so a `scene galaxy` selection snaps back to the shader scene within 8 s and remounts the WebGL canvas. Make the pull opt-out: `fxShuffle({ pull = true } = {})`, with manual callers passing `{ pull: false }`. |
| P2-10 ✅ | `Terminal.jsx:540` | Guided-tour number keys work exactly once, then print `command not found: 2`. |
| P2-11 ✅ | `vfs.js:68`, `:176` | The VFS keys files by name in a plain object, so two experiences at the same company (a promotion — very common) or two projects with the same title **silently collapse into one file**. `ls ~/experience` shows 4 of 5; publish validation reports nothing. Fix centrally in `dir()` with a `-2` suffix. |
| P2-12 ✅ | `vfs.js:174` | `~/resume.pdf` is pinned to the bundled `public/AgrimSigdel-CV.pdf` and a hardcoded 76874-byte size, so an admin CV replacement never reaches the terminal — the two modes hand out different documents. |
| P2-13 ✅ | `TerminalViews.jsx:32` | Guided-tour item 4 hardcodes `~/research/catd.md`, but that filename is *parsed out of the editable research title*. Rename the paper in `/admin` and the flagship research path 404s. |
| P2-14 ⚠️ | `Terminal.jsx:188` | Every keystroke re-runs up to 12 regexes per scrollback line and rebuilds the whole output tree. |
| P2-15 ⚠️ | `Terminal.jsx:488` | JetBrains Mono is requested only after the Terminal chunk mounts, so `/terminal` paints its ASCII UI in a fallback font and reflows. |
| P2-16 ⚠️ | `vfs.js:233` | Path lookup walks the prototype chain — `cat ~/constructor` silently succeeds with no output. |

### Accessibility

| # | Where | Defect |
|---|---|---|
| P2-17 ✅ | `Terminal.jsx:878` | The live input row sits inside `role="log" aria-live="polite"`, so screen readers re-announce it **on every keystroke**. |
| P2-18 ⚠️ | `StarryNight.jsx:218` | The WebGL backdrop ignores `prefers-reduced-motion` and offers no way to stop or hide it. `MotionConfig reducedMotion="user"` does not cover canvas. |
| P2-19 ⚠️ | `FunModePage.jsx:82` | `/normal` cannot be scrolled with the keyboard until the user tabs into the tilt container. |
| P2-20 ⚠️ | `Hero.jsx:75` | `opacity` stacked on already-muted text drops four strings below AA in the default light theme. |
| P2-21 ⚠️ | `ContactForm.css:122` | Placeholder, "(optional)", the counter and the close glyph sit below AA in all three contact-form variants. |
| P2-22 ⚠️ | `Terminal.jsx:259` | Terminal window controls are 12×12 px with 21 px between centres — under WCAG 2.5.8. |
| P2-23 ⚠️ | `caseStudy.css:59` | The WIP badge is 3.20:1 in light theme (moot once P0-4 lands). |
| P2-24 ⚠️ | `CaseStudyPage.jsx:43` | No `<main>` landmark, and no page on the site has a skip link. |
| P2-25 ✅ | `ContactForm.jsx:194` | `aria-live="polite"` on the character counter announces the count on every keystroke. |

### Performance

| # | Where | Defect |
|---|---|---|
| P2-26 ✅ | `ContentProvider.jsx:2` | **~211 kB of the 264 kB entry chunk (≈53 kB of its 72.7 kB gzip) is `@supabase/supabase-js`**, eagerly loaded on the landing page for a single anonymous REST GET. That's 38 % of the 146 kB gzip of blocking JS. Replace the client import in `ContentProvider` with a plain `fetch()` against the REST endpoint, or `import()` it lazily — the admin bundle can keep the full client. |
| P2-27 ⚠️ | `vite.config.js:31` | The `StaleWhileRevalidate` rule matches `/assets/*.js` including content-hashed immutable chunks, so the 960 kB StarryNight chunk is re-downloaded in the background on every terminal visit. |
| P2-28 ⚠️ | `vite.config.js:25` | The PWA precaches the `/admin` CMS bundle (~47 kB) onto every public visitor's device. |
| P2-29 ⚠️ | `Ticker.jsx:28` | Six copies of each giant headline where two suffice, half with `-webkit-text-stroke`. |
| P2-30 ⚠️ | `Terminal.jsx:517` | `useSyncExternalStore` takes the **whole** fx store object as its snapshot but uses one boolean, so dragging any fx slider re-renders the entire scrollback. Use `() => fxGetState().auto`. |

### Content, data and config

| # | Where | Defect |
|---|---|---|
| P2-31 ✅ | `ContentProvider.jsx:32` | The remote row replaces the whole tree unvalidated, and `SelectorRoute` (`/`) is the one route with **no ErrorBoundary** — a partial row throws at `ModeTriptych.jsx:88-93` and white-screens the landing page. Note `ErrorBoundary` alone is a net, not a fix: its only remedy is `reload()`, which refetches the same row. Validate the shape before `setContent`. |
| P2-32 ✅ | `Research.jsx:29` | The headline stat row is hardcoded (`98.9%`, `90.4%`, `+24.5pp`, `61–73%`) while the same figures live at `content.json:95-97` — editing them in `/admin` silently desyncs the tiles directly above the bullets. |
| P2-33 ✅ | `init_admin_cms.sql:32`, `:65-68` | No rate limit, no length caps, and anon can set `status`, `created_at` and `replied_at` on insert. Each insert fans out to a paid Resend email with no dedupe or cooldown; `{"created_at":"2999-01-01"}` pins a spam row to the top of the inbox forever. Nothing leaks (anon has INSERT only, verified: anon SELECT returns `200 []`). Add a `not valid` CHECK migration, `revoke insert … grant insert (name, email, phone, message)`, and route submissions through a captcha'd Edge Function. |
| P2-34 ✅ | `ModeTriptych.css:415` | Doors clip their own text at ≤720 px: ~62 px per door at 667×375 landscape (vs ~122 px min-content, ~157 px for the Terminal door), ~125 px at 375×553. `justify-content: center` clips both top and bottom, and `App.jsx:80` locks body scroll so nothing can be scrolled to. Fix with `flex: 1 0 auto` on `.tri-door` + `overflow-y: auto` on the fixed root. |

---

## P3 — polish, hygiene, doc drift

<a id="l1"></a>
### L1 ✅ `npm run lint`'s 17 errors are 14 false positives — do not "fix" them naively

`eslint.config.js:11-15` never loads `eslint-plugin-react`, so `react/jsx-uses-vars` is
missing and core `no-unused-vars` can't see an identifier used as a JSX tag. Every
`'motion' is defined but never used` error is bogus — those files genuinely render
`<motion.*>` (12 sites in `Terminal.jsx`, 14 in `CaseStudyPage.jsx`, …).

**This is a landmine:** the obvious response is to delete the import, which turns the
page into a runtime `ReferenceError: motion is not defined` — a blank screen, not a
build error.

Fix: `npm i -D eslint-plugin-react`, then register **only** `'react/jsx-uses-vars':
'error'`. Skip `react/jsx-uses-react` (it would re-mask the dead `React` imports) and
do **not** use `react.configs.flat.recommended` — it enables `react/prop-types`, and
this codebase has zero `propTypes`.

Only then narrow `varsIgnorePattern: '^[A-Z_]'` to `'^_'` and delete what surfaces.

The two genuine errors: `ThemeContext.jsx:32` (`react-refresh/only-export-components`)
and `NormalModeLayout.jsx:18` (`react-hooks/set-state-in-effect`). The `mounted` flag
there is **not** dead code — `normal-mode.css:17` sets `.cv-mode { opacity: 0 }` and
only `.cv-mode.visible` restores it, so deleting the effect renders `/cv` invisible.

### Dead code

- ✅ `main.jsx:1` imports `StrictMode` and never applies it — the app has **never** run
  under StrictMode, which is why the focus-thrash and set-state-in-effect classes of
  bug went unnoticed in dev.
- ✅ `src/shared/ui/ThemeToggle.jsx` — 44 lines, nothing imports it; the working control
  is inline in `Navbar.jsx:31`.
- ✅ Seven unreachable FSD barrels: `shared/index.js`, `shared/ui/index.js`,
  `widgets/index.js`, `pages/index.js`, `features/modeSelection/index.js`,
  `features/terminalMode/ui/index.js`, `features/terminalMode/lib/index.js`. Only
  `entities/portfolio/model/index.js` is used.
- ⚠️ `generateResumePdf.js` (220 lines) and the `jspdf` dependency are unreachable —
  the only call site is commented out at `NormalModeLayout.jsx:6`/`:37-43`. Rollup
  tree-shakes it, so it's dead weight plus doc drift.
- ✅ `Footer.jsx:2`/`:6` — unused `Squiggle` import and unused `onResetMode` prop
  (the footer has no "back to start" affordance as a result).
- ⚠️ `content.json:699` — the entire `terminalMode` block is dead data and its help
  text no longer matches the real command set.
- ⚠️ `SectionEditors.jsx:182` — `/admin` exposes a "Fun mode → About → Title" field no
  component reads.

### Public repo and public directory

The repo is public (`api.github.com/repos/Agrim-Sigdel/Portfolio` → `"private": false`)
and the site links to it from `content.json:569`, rendered in two visitor-facing places
(`CaseStudyPage.jsx:86-101`, `WorkGrid.jsx:87-95`).

- ✅ `README.md` is unmodified `create-vite` output, 17 lines, verbatim on `origin/main`.
  Replace it — and explicitly note that the slug↔mode mapping at `App.jsx:31-32` is
  intentional, so a reviewer doesn't read it as a bug.
- ⚠️ Everything in `public/` is served live: `public/DESIGN.md` (internal design brief
  describing a system the site doesn't use) and `public/cv.txt` (a `pdftotext` dump
  with extraction artifacts, referenced by nothing) are both fetchable on the domain.
- ⚠️ `docs/SITE-AUDIT-2026-07.md` (self-rated 5.5/10) and `REFACTORING_SUMMARY.md` are
  on `origin/main`. **This document is in the same category** — decide deliberately
  whether it stays public.
- ✅ `FSD_STRUCTURE.md:11` documents directories that don't exist (`src/app/config/`,
  `src/app/styles/`, `ModeSelector.jsx`, `widgets/footer/`).
- ✅ `DEPLOY.md` names branch `feat/supabase-admin-cms`, which no longer exists.
- ✅ No secrets are committed. All 60 commits swept for `re_*`, service-role JWTs and
  tracked `.env` — clean, only `*.example` was ever committed. `.gitignore` correctly
  excludes `.env`, `.env.*`, `supabase/.env`.
- ⚠️ Add `.qodo/` to `.gitignore` (empty today, so git ignores it, but `git add -A`
  would sweep a future non-empty state).

### Copy and metadata

- ⚠️ `index.html:118` — the `<noscript>` LinkedIn link is `/in/agrimsigdel` while the
  JSON-LD `sameAs` (`:56`) and `content.json:28-29` use
  `/in/agrim-sigdel-34b532151/`. The noscript copy is what non-JS crawlers follow.
- ⚠️ `NormalModeLayout.jsx:33` — "Download cv" on the most prominent control of the
  résumé page.
- ⚠️ `Footer.jsx:60` — hardcoded "© 2026", silently wrong on 2027-01-01.
- ⚠️ `index.html:24` — static `theme-color: #0b0b0b` while `/cv` forces light.
- ⚠️ `site.webmanifest:24` — the maskable icon reuses the un-padded `any` icon; the
  glyph's serif feet sit ~226 px from centre in a 512 px image against a ~205 px safe
  radius, so Android crops them.
- ⚠️ `public/sitemap.xml` omits all nine `/work/:slug` case studies and its `lastmod`
  dates are ~5 weeks stale.
- ⚠️ `netlify.toml:12`/`:17`, `DEPLOY.md:140`, `SETUP.md:209` all require
  `VITE_SITE_URL`, and it's exempted from the secrets scan — but **no code reads it**.
  The only `import.meta.env` reads are the two Supabase vars. Wire it up or delete it
  from all three docs.
- ⚠️ `ProjectsEditor.jsx:97` — the colour swatch can't represent a 3-digit hex in the
  seed and silently rewrites it.
- ⚠️ `Hero.jsx:76` — hardcodes exactly two specializations while the admin field
  accepts any number.
- ⚠️ `Terminal.jsx:1021` — `fx panel` reports "carousel panel opened" on touch devices,
  where `FxHud` is never rendered.
- ⚠️ `CommandParser.jsx:575` — the contact email and job title are hardcoded in the
  terminal, so `/admin` edits don't reach them.

### Dependencies and security headers

- ⚠️ `netlify.toml` sets **no** security headers — no `X-Frame-Options`, no CSP, no
  `Referrer-Policy`, and there's no `public/_headers`. Downgraded from the original
  filing (a single-user CMS is a poor clickjack target), but with `Terminal.jsx:488`
  injecting a third-party stylesheet at runtime and Storage-hosted uploads in the
  render path, there is zero defence-in-depth for a two-line fix.
- ⚠️ `easy-3dkit@0.3.1` declares `@react-three/postprocessing` as a peer; it's in
  neither `node_modules` nor the lockfile, so that library's PostFX subpath can't build.
- ⚠️ `npm audit`: 13 high, 0 critical. Eleven are dev/build-only chains that never
  reach `dist/`. The other two are `react-router`/`react-router-dom` 7.18.1 against
  GHSA-qwww-vcr4-c8h2, and the offered remediation is a **downgrade** — refuse it and
  track the advisory.
- ⚠️ `content.json:341` carries a Roboflow workflow embed JWT (decoded: no `exp` claim)
  surfaced as a public "Test the Workflow" button. Public by design, but if it
  authorizes inference against your quota it never expires. Worth a two-minute check.
- ⚠️ `caniuse-lite` is 6 months stale — `npx update-browserslist-db@latest`.

---

## Explicitly refuted — do not re-file

These were filed by a sweep and then disproved by an independent verifier. Recorded so
they don't come back.

| Claim | Why it fell |
|---|---|
| `notify-contact` fails open when `WEBHOOK_SECRET` is unset | The guard is correct; the claimed bypass doesn't exist. |
| `contact_messages.email` is unvalidated into a `Reply-To` header | `_shared/email.ts` escaping (`esc` covers `& < > " '`, `escMultiline` handles newlines) holds on every user-controlled interpolation. |
| `send-reply` returns `ok:true` without checking the outbox write | The write is checked. |
| `netlify.toml` leaves `/admin` framable — filed as a real exposure | Real gap, wrong severity; kept above as a low-severity item, not a finding. |
| `SEO.jsx` per-route og: tags never run for crawlers | True but not a *defect* in the filed sense — restated in P0-5. |
| `robots.txt` allows `/admin` | Verified: it does not create the exposure claimed. |
| The landing route has no ErrorBoundary | Refuted as filed, then **re-confirmed from a different angle** — see P2-31, where the real failure is the unvalidated content swap. |
| The downloadable CV PDF is stale (missing 1 job, 7 of 9 projects) | The PDF is a deliberately curated document, not a generated artifact. |
| Remote content swapped in unvalidated (as originally scoped) | Refuted at the filed severity; the reachable version is P2-31. |

Also corrected during the audit: 4 of round 1's 15 "confirmed" findings were duplicate
pairs (`CaseStudyPage.jsx:36` and `index.html:33` each filed twice), so round 1's real
count is 13. The og:image finding overstated its impact ("no platform renders a card")
and mis-cited `:33` for a tag at `:38`; both are corrected in P0-5.

---

## Fix order

| # | Group | Effort | Blind-safe? |
|---|---|---|---|
| 1 | **P0-1 auth lockdown** — dashboard toggle → curl verify → `is_admin()` migration across all nine policies → `ADMIN_USER_ID` in `send-reply` → fix the four false comments | 10 min + 45-90 min | ❌ verify at every step; re-test with a throwaway JWT |
| 2 | **P0-4, P0-5, P0-6** — three one-line text edits, one build | 15 min | ✅ then force a social re-scrape |
| 3 | **P0-3 + P1-3, P1-4, P1-5** — the CSS/contrast pass | 45-60 min | ❌ needs manual hover + tab testing |
| 4 | **P0-2 service worker denylist** | 10 min edit, 20 min verify | ❌ grep `dist/sw.js` for `denylist:[`, test with the new SW activated |
| 5 | **P1-1, P1-2, P2-1…P2-6** — the admin write path | 2-3 h | ⚠️ mostly blind; test publish conflict manually |
| 6 | **P1-9 + P2-31** — content-crash hardening | 45 min | ✅ test by emptying `education` locally |
| 7 | **P1-10** — hydration gate + not-found panel | 1-1.5 h | ❌ can hang the app if a settle path is missed; test cold loads incl. no `.env.local` |
| 8 | **P1-6, P1-7, P1-8, P2-9…P2-13** — terminal + shared UI | 2-3 h | ⚠️ manual smoke test per command |
| 9 | **P2-33** contact-table hardening (CHECK + grants) | 1-2 h | ✅ re-run the `DEPLOY.md:88-96` curl |
| 10 | **P2-34** mobile triptych | 45-60 min | ❌ test at 667×375, 375×553, 360×584 with touch emulated |
| 11 | **P2-26** — get supabase-js off the landing critical path | 1-2 h | ⚠️ verify chunk sizes after |
| 12 | **L1** lint config, then the dead-code sweep | 1-1.5 h | ❌ a mistakenly deleted `motion` import is a blank page, not a build error |
| 13 | **P3** docs, README, public/ cleanup, copy fixes | 1-2 h | ✅ |

Groups 1-4 are the launch gate. Everything else can land after go-live.

---

## Coverage and limitations

Be honest about what this audit is and isn't:

- **No browser was ever launched.** Every visual, responsive, hover and contrast
  finding is computed from the actual CSS values (clamp/padding/font-size arithmetic
  and specificity math, cross-checked against the shipped stylesheets in `dist/`) —
  not seen rendered. The 667×375 / 375×553 / 360×584 numbers are arithmetic, and real
  Safari chrome makes the landscape case worse than stated.
- **The build was not re-run** during the sweeps; all `dist/` evidence comes from the
  committed tree, which matches the reported chunk list.
- **Edge Functions were never executed.** The email-escaping review of
  `_shared/email.ts` is source-level only — it looked clean, but no real Resend header
  handling was observed, so nothing is claimed about CRLF injection in their API.
- **Live Supabase state was only partially probed.** Confirmed read-only:
  `disable_signup: false`, `mailer_autoconfirm: false`, `anonymous_users: false`, all
  OAuth/phone/passkey/SAML false, `send-reply` deployed and returning its own 401, and
  anon SELECT on `contact_messages` returning `200 []`. **Not** confirmed: whether
  `WEBHOOK_SECRET` is non-empty, whether the Database Webhook from `DEPLOY.md:57-65`
  exists, whether migrations `20260725190000` and `20260725200000` were applied to
  production, whether the deployed functions carry `config.toml`'s `verify_jwt` values,
  or whether `agrimsigdel.com.np` is verified in Resend.
- **Netlify dashboard state** (which env vars are actually set, deploy-preview
  `noindex`, the Forms cleanup in `DEPLOY.md` B2) is outside the repo and unverified.
- **~26 low-severity findings were never independently verified** — everything tagged
  ⚠️ above. They ran past the verification cap.
- **No test suite exists.** That was treated as a known, accepted state, so "add tests"
  was never filed as a finding.

### Round 1 coverage failure (recorded for future runs)

Six of the ten sweeps in the first run died on transient `ENOTFOUND` network errors and
returned nothing, so round 1 read only ~20 of 103 files — the three largest source
files in the repo (`Terminal.jsx` 1087, `CommandParser.jsx` 748, `ContactInbox.jsx`
426) plus ~2100 lines of CSS and the entire admin *write* path were never opened. Round
2 re-ran exactly those six with retry-on-failure, which is where P1-1, P1-2, P1-6,
P1-7, P2-9…P2-13 and the real contrast numbers came from.

The lesson: a completeness critic caught this, a finding count did not. Round 1's
report looked confident and complete while covering a fifth of the codebase.

---

## How this audit was run

Two multi-agent workflow runs, ~60 agents total, ~2.9 M tokens.

**Phase 1 — ten parallel specialist sweeps**, each given the same project context plus
a dimension-specific brief and told to cite real `file:line` with a concrete failure
scenario:
`terminal` · `admin` · `edge-security` · `hooks` · `content-data` · `a11y` · `perf` ·
`deploy-seo` · `ux-routing` · `hygiene`

**Phase 2 — adversarial verification.** Findings were deduped across dimensions, then
each was handed to an independent agent instructed to *refute* it — default to
`refuted: true` unless the code plainly proves the defect is reachable — and to correct
the severity and the proposed fix. 9 of 24 fell in round 1; 2 of 27 in round 2.

**Phase 3 — synthesis plus a completeness critic** whose only job was to find what the
audit missed. It caught the duplicate pairs, the mis-scoped `theme.css` finding, and
the round-1 coverage collapse.

Reproduce or extend:

```
/private/tmp/.../scratchpad/round2.js        # the round-2 workflow script
~/.claude/projects/.../workflows/scripts/    # the original 10-dimension script
```

Scripts persist per run; edit and re-invoke `Workflow` with `scriptPath` to iterate.
