# Website Audit & Improvement Plan — July 2026

Full audit of the portfolio (accessibility, performance, responsiveness, UI/UX) plus a
per-mode viewport analysis and the mode-selector redesign options.
This is the durable record — check items off as they land.

---

## 1. Ratings

| Dimension | Rating | Verdict |
|---|---|---|
| Accessibility | 4.5 / 10 | Great instincts, but 2 critical blockers + keyboard hijacking |
| Performance | 6 / 10 | Excellent code-splitting; double WebGL canvases + heavy shader drag it down |
| Responsiveness | 5 / 10 | Selector is exemplary; fun mode & terminal break down on mobile |
| UI / UX | 6 / 10 | Memorable and deep, but confusing names + entry friction + credibility nits |
| Engineering craft | 8.5 / 10 | Clean FSD structure, graceful degradation, single content source |
| **Overall** | **5.5 / 10** | High-craft site; worst bugs fixable in days |

Initial JS is ~81 KB gzip before the lazy three.js chunk (298 KB gzip) — the skeleton is fast.

---

## 2. Per-mode viewport matrix

Naming note: UI label → internal id → route: **CV** → `normal` → `/cv` · **Normal** → `fun` → `/normal` · **Terminal** → `work` → `/terminal`.

| Mode | Mobile ≤480px | Tablet 768–1024 (touch) | Laptop/Desktop | Short viewport (≤720px h) | Print |
|---|---|---|---|---|---|
| Mode selector `/` | 🟡 Good layout; small touch targets; hold gesture risks long-press selection; WebGL too heavy for low-end phones | 🟢 Fine | 🟢 Excellent | 🟢 Explicitly handled | n/a |
| CV `/cv` | 🟡 Works (680px breakpoint exists); inputs <16px trigger iOS zoom; buttons shrink small | 🟢 Fine | 🟢 Clean; `100vw` scrollbar sliver | 🟢 Fine | 🟢 Dedicated print stylesheet |
| Fun `/normal` | 🔴 **Broken**: navbar clipped both sides, page rests tilted/skewed (no touch input for tilt), 100vh/150vh chrome jumps, missing utility CSS, zero media queries in funMode.css | 🔴 Same tilt-skew problem (touch) | 🟡 Works as designed, but heavy (tilt + preserve-3d + backdrop-filter) and typography degraded by the globals.css bug | 🟡 Hero sticky range tuned to desktop | 🔴 None |
| Terminal `/terminal` | 🔴 Impractical: invisible input (no tap-to-type cue), virtual keyboard covers fixed 100vh layout, ~570px ASCII art clipped, 12px traffic lights | 🟡 Usable, mild 100vh chrome issue | 🟢 Great (tab-complete, history, palette) | 🟢 Fine | n/a |

**Verdict:** desktop experience ranges good→excellent everywhere. On phones, only the selector and CV hold up; the flagship fun mode is the *worst* page on mobile, and it's the one labeled "Normal".

---

## 3. Confirmed bugs (verified, not theoretical)

### 3.1 `globals.css` never ships ✅ verified against `dist/`
`src/shared/styles/globals.css` is imported only by `src/app/config/appConfig.js`, which nothing imports → Vite drops it.
Verified: `text-5xl` / `tracking-widest` absent from built CSS. Every fun-mode section using
`text-*`, `flex`, `flex-wrap`, `gap-3`, `uppercase`, `tracking-widest`, `mb-*`, `leading-*`, `opacity-*`
renders unstyled (e.g. `About.jsx:32`, `About.jsx:59`, `WorkGrid.jsx:29`). Also loses the mobile `h1/h2/h3`
clamp block — `index.css` partially duplicates h1/h2 but never scales h3.
**Fix:** migrate the utility classes + 768px heading block into `index.css` (do NOT just import globals.css —
it triple-defines `:root` tokens that conflict with `theme.css`, incl. a different `--accent-red`). Then delete
`globals.css` + `appConfig.js`.

### 3.2 Fun-mode navbar clipped on both sides on mobile ✅ diagnosed
Three stacked causes:

1. **Pill wider than the viewport.** At ≤768px (`Navbar.css:125-152`) it still renders logo "AGRIM." +
   4 uppercase links (About/Work/Experience/Research, 0.75rem + 1px letter-spacing, 1.2rem gaps) + 32px toggle
   in one non-wrapping row ≈ **450–480px min-content width** vs 360–430px phone viewports. Nothing can shrink
   (text doesn't wrap, no `min-width: 0`, no `max-width` on the pill).
2. **Centered overflow = clipped equally on both sides.** The fixed wrapper (`Navbar.jsx:52`) is
   `width: 100%; display: flex; justify-content: center`, so the too-wide pill overflows symmetrically.
3. **The tilt container does the clipping (and breaks `position: fixed`).** The navbar renders *inside*
   `.fun-mode-tilted-content` (`FunModePage.jsx:97`), which has a transform + `overflowX: hidden` +
   `borderRadius: 20px`. A transformed ancestor turns `position: fixed` into absolute-like positioning against
   that ancestor, and its `overflowX: hidden` slices the pill's overflow. On touch, the resting
   `rotateX(12°) rotateY(-20°)` skew (mouse-only input, `FunModePage.jsx:27-43`) shears/clips it further.

**Fix plan (ordered):**
- [ ] Patch (30 min): `.navbar-pill { max-width: calc(100vw - 32px); }` + `.navbar-links { min-width: 0; }` and at ≤640px hide `.navbar-links` so logo + toggle always fit.
- [ ] Proper (2–3 h): hamburger at ≤640px — pill holds logo + theme toggle + 44px menu button (`aria-expanded`, Escape closes); links open in a full-width sheet below the pill.
- [ ] Structural: move `<Navbar />` *outside* `TiltPresentationWrapper` (precedent: `ReturnToStartButton` already is). Hoist the scroll-container ref up to `FunModePage` and provide it to both, so in-page scrolling keeps working. This restores true viewport-fixed positioning and un-skews the nav.
- [ ] Root cause on touch: zero the tilt under `(hover: none)` / `(pointer: coarse)` so the whole pane isn't skewed (§5 R2).
- [ ] While in there: make `.navbar-logo` a `<button>` (it's a `div onClick` — not keyboard operable, a11y S3).

---

## 4. Accessibility findings (WCAG 2.1 AA)

### Critical
- [ ] **C1 — Terminal output has no live region.** `Terminal.jsx:516-540`: output is plain divs; SR users hear nothing after a command. Add `role="log"` + `aria-live="polite"`. (4.1.3)
- [ ] **C2 — Terminal input unlabeled.** `Terminal.jsx:560-572`: hidden input, no `aria-label`. (4.1.2)

### Serious
- [ ] **S1 — No focus trap in ContactModal.** `ContactModal.jsx:28-95` — Tab escapes the dialog. (Everything else — Esc, focus restore, scroll lock — is already right.)
- [ ] **S2 — Selector key handler hijacks Enter/Space.** `ModeSelector.jsx:195-236` preventDefaults on window keydown, so a focused sound toggle / Contact button / arrow launches a mode instead of activating. Skip handling when `e.target.closest('button, a')`. (2.1.1)
- [ ] **S3 — Navbar logo is `div onClick`.** `Navbar.jsx:60`. Make it a button. (2.1.1)
- [ ] **S4 — Almost no `prefers-reduced-motion`.** Only `ModeSelector.css:700` (which misses the warp). Nothing in JS. Fix systemically: wrap app in `<MotionConfig reducedMotion="user">`, gate tilt/WebGL/Squiggle on `matchMedia`, extend the CSS block to warps + terminal cursor blink. (2.2.2)
- [ ] **S5 — CV contrast failures on white.** `#db5a34` = 3.80:1 (titles, company names, links, pills), `#888` = 3.54:1 (periods, form labels) in `normal-mode.css`. Darken to ≥4.5:1 (e.g. `#c14a24`, `#6b6b6b`). (1.4.3)

### Moderate
- [ ] M1 No `<main>` landmark or skip link anywhere.
- [ ] M2 No focus management on mode/route change (focus orphaned after warp).
- [ ] M3 Fun-mode heading hierarchy broken (`About.jsx` h2→h4; WorkGrid has no h2).
- [ ] M4 Selector strip misuses `role="tablist"/"tab"` (no tabpanel/aria-controls) — use plain buttons or complete the pattern.
- [ ] M5 WebGL canvases missing `aria-hidden` (BioluminescentField, ModePortal, PortalWarp, StarryNight). CSS fallbacks already do this right.
- [ ] M6 `Squiggle.jsx` SVGs missing `aria-hidden`.
- [ ] M7 Terminal `dim #6e7681` = 4.12:1, `dimmer #484f58` ≈ 2.3:1 (ghost autocomplete text nearly invisible).
- [ ] M8 Selector legend/counter ~3.6:1 — the only usage instructions on screen.
- [ ] M9 Required form fields not marked (`required`/`aria-required` + visual cue) in `ContactForm.jsx`.
- [ ] M10 Field errors not linked via `aria-describedby`.
- [ ] M11 Terminal icon-only buttons (palette `❯_`, traffic lights, dock) need `aria-label`/`aria-expanded`.
- [ ] M12 `ThemeToggle.jsx` has `title` but no `aria-label` (Navbar's own toggle is the correct model).
- [ ] M13 Ticker repeats content 6× to SRs — `aria-hidden` the marquee.

### Minor
- [ ] Touch targets <44px sweep (worst: 12×12 terminal traffic lights; modal close 32px; selector controls 34–38px).
- [ ] `:focus-visible` styles for buttons/links (UA default is low-contrast on dark surfaces).
- [ ] Low-contrast placeholders (3 forms) · footer copyright at 50% opacity · WorkGrid `cursor:pointer` on non-clickable cards · ThemeContext ignores `prefers-color-scheme`.

### Already done well — do not regress
Opt-in muted-by-default synthesized audio · ContactModal Esc/focus-restore/scroll-lock · ContactForm labels,
autocomplete, `role="alert"`, honeypot · icons consistently `aria-hidden` · labeled social nav · CV semantic
HTML + print CSS · zoom never disabled · noscript SEO fallback · WebGL→CSS fallback · per-mode `document.title`.

---

## 5. Performance findings

### Critical
- [ ] **P-C1 — Preview canvas remounts on every mode focus change.** `ModeSelector.jsx:354-401`: `ModePortal`'s `<Canvas>` sits inside `AnimatePresence` keyed by `current.id` → full WebGL context teardown/create per arrow-press/hover. Risks hitting the browser context limit; `useWebGL.js` then reads context-loss as "no WebGL" and downgrades the session. Keep ONE persistent canvas, swap only `variant`.
- [ ] **P-C2 — Nebula shader too heavy.** `BioluminescentField.jsx:154-228`: 6-octave fBm ×5 calls per fragment, full-screen, dpr [1,2], every frame, plus ~5,900 additive sprites. Reduce to 3–4 octaves, dpr [1,1.5], pause on `document.hidden`, cut star counts (esp. on mobile).

### Serious
- [ ] **P-S1 — Two `* { transition }` rules.** `theme.css:59-66` + `funMode.css:184-186` (adds box-shadow, applies site-wide via App.jsx import). Theme toggle restyles every node. Scope to the elements that change.
- [ ] **P-S2 — `three` chunk over-merged.** `vite.config.js` bundles `easy-3dkit` (terminal-only, drags GSAP) + `@react-three/drei` (unused) with three/fiber that the landing page fetches. Split them.
- [ ] **P-S3 — Fun mode composites the whole page in 3D.** perspective + preserve-3d + box-shadow + border-radius on the *scroll container*, under a backdrop-filter navbar. Apply tilt to a non-scrolling layer; disable on touch.
- [ ] **P-S4 — No cache headers.** Add to `netlify.toml`: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`.
- [ ] **P-S5 — Terminal font via runtime `@import`.** `Terminal.jsx:457-458` — move JetBrains Mono to a `<link>` in `index.html`.

### Moderate / cleanup
- [ ] Delete unused `public/kurama-pointer.png` (276 KB) + `public/gojo.png` (49 KB).
- [ ] Delete dead components: `Preloader`, `CustomCursor`, `SnakeBackground`, `SnakeSquiggle` (+ inert `data-cursor` attrs), `appConfig.js`, `globals.css` (after §3.1 migration).
- [ ] Compress `CATD-Submission.pdf` (518 KB) if feasible.
- [ ] dpr [1,1.5] on portal/warp canvases too.

### Already done well
Route-level lazy chunks per mode · three.js gated on WebGL probe · CSS-only fallbacks · zero `<img>` in UI
(great LCP/CLS) · font preconnect + `display=swap` · charge state in refs (no per-frame React renders) ·
seeded RNG in `useMemo` · react-icons subpath imports.

---

## 6. Responsiveness findings

- [ ] **R1** = §3.1 globals.css bug (the biggest one).
- [ ] **R2 — Tilt is mouse-only → permanent skew on touch.** `FunModePage.jsx:27-55`: resting `rotateX 12° / rotateY -20°` until 400px scroll. Zero it on `(hover: none)`.
- [ ] **R3 — `100vh` sweep → `100dvh`** (with `100vh` fallback line): `Terminal.jsx:449,488`, `Hero.jsx:22`, `FunModePage.jsx:49,60`, `index.css:133`, `ContactModal.css:30`. Selector already does this right.
- [ ] **R4 — Inputs <16px trigger iOS zoom:** `normal-mode.css:299` (0.95rem), `ContactModal.css:178` (0.9rem), `Terminal.jsx:570` (0.875rem).
- [ ] **R5 — Terminal mobile:** add "tap to type" cue; hide/scroll the ~68-col ASCII art under ~600px; handle virtual keyboard (visualViewport or dvh).
- [ ] **R6 — Navbar mobile collapse** = §3.2.
- [ ] **R7 — 44px touch-target minimum** at coarse-pointer widths (selector arrows/socials/sound, navbar toggle).
- [ ] **R8 — Hero 150vh + 100vh sticky** tuned to desktop; verify on small viewports after dvh switch.
- [ ] **R9 — WebGL device gating:** prefer CSS-lite field (or dpr 1 / fewer stars) on coarse pointers / low `deviceMemory`.
- [ ] **R10 — No error boundary; `Suspense fallback={null}`** → blank screen on chunk failure. Add boundary with retry + themed loader.
- [ ] Minor: `:root` tokens defined 3× (index/globals/theme, with a conflicting `--accent-red`) · sticky `:hover` on touch (wrap in `@media (hover:hover)`) · `.cv-mode width:100vw` scrollbar sliver · `calc(100vh - 3rem)` modal height · selector hold-gesture needs `user-select: none` / `-webkit-touch-callout: none` guards.

---

## 7. UX findings

- [ ] **U1 — Mode naming confusion.** Flashy portfolio is labeled "Normal" / "Fluid dynamics"; résumé is "CV". Rename to *Résumé / Portfolio / Terminal* with plain-language subtitles. Longer-term: fix the id↔slug inversion (`fun`→`/normal`, `normal`→`/cv`) — it already caused the wrong canonical (U5).
- [ ] **U2 — No cross-mode switcher.** Only terminal can jump modes; CV/fun force a selector round-trip (+ intro replay). Add a consistent switcher in all modes.
- [ ] **U3 — Entry friction ≈ 3.5s** (unlock intro ~1.3s + hold 700ms + warp 1.5s). Skip intro for return visitors (`useVisitedModes` already persists), make click instant.
- [ ] **U4 — LinkedIn URL mismatch:** `index.html:55` (`/in/agrimsigdel`) vs `content.json` (`/in/agrim-sigdel-34b532151/`). Pick the real one.
- [ ] **U5 — CV canonical wrong:** `NormalModePage.jsx:13` advertises `/normal` (a different page). Use `/cv`; add per-mode `<SEO>` to fun + terminal.
- [ ] **U6 — Silent 404** (`App.jsx:33`): show a small 404 page instead of silent redirect.
- [ ] **U7 — Typo "Developement"** in giant ticker text: `TickerSection.jsx:21`.
- [ ] **U8 — Fixed Back button overlaps footer** on mobile (`ReturnToStartButton` bottom-right vs footer CTA).
- [ ] **U9 — Terminal escape hatch** for non-technical visitors: auto-open the command palette on first visit or make the `❯_` affordance prominent.
- [ ] Minor: legend shows desktop-only key hints to touch users (no "tap & hold" wording) · theme toggle only has any effect in fun mode (confusing) · `sudo` easter egg styled as a real error.

---

## 8. The phased plan

**Phase 0 — Credibility quick wins (~1 h):** U7 typo · U4 LinkedIn · U5 canonical/SEO · delete dead code + unused PNGs · netlify cache headers.
**Phase 1 — Restore missing stylesheet (~½ day):** §3.1 migration + visual verify of fun mode.
**Phase 2 — Accessibility blockers (~1 day):** C1, C2, S1, S2, S4 (`MotionConfig`), S5 colors, then M-items (landmarks, aria-hidden sweep, form attrs, focus-visible).
**Phase 3 — Mobile (~1–2 days):** §3.2 navbar (patch → hamburger → move out of tilt) · R2 tilt off on touch · R3 dvh sweep · R4 16px inputs · R7 touch targets · R5 terminal affordances.
**Phase 4 — Performance (~1–2 days):** P-C1 persistent canvas · P-C2 shader diet · P-S1 scoped transitions · P-S2 chunk split · P-S5 font link · R10 error boundary/loader.
**Phase 5 — Selector redesign + UX (~2–3 days):** pick an option below · U1 renames · U2 mode switcher · U3 friction removal · U6 404 page.

---

## 9. Mode-selector redesign options

All three fix: unclear names, ~3.5s friction, keyboard hijack, dual-canvas cost.

### Option A — "The Triptych" ⭐ recommended
Three full-height doors that *look like* the modes behind them (paper/serif · aurora gradient ·
dark scanlines). Hover/focus expands a door (flex 1→1.6); one click enters. Each door is a real
`<a>` router link → new-tab/middle-click/keyboard free; no global key handler. Pure CSS/framer —
no WebGL on first paint. Mobile: three stacked ~30dvh rows. Name + tagline above, socials below.

### Option B — "Editorial Landing" (best for recruiters/SEO)
Landing becomes a real page in the DESIGN.md "Chromatic Editorial" style: name, one-line summary,
3 highlight cards + CATD stat + contact below the fold. Modes demoted to "three ways to view"
cards. Homepage finally has indexable content. Least wow-factor.

### Option C — "Arcade 2.0" (keep identity, kill friction)
Same HUD soul: all three cards visible + directly launchable, click = instant (400ms warp),
hold = optional full warp easter egg, no lock intro after first visit, plain-language subtitles,
scoped key handling, one shared canvas (or CSS portals full-time). ~70% code survives.

**Whichever option: rename modes to Résumé / Portfolio / Terminal.**
Recommendation: **A**, with B's intro sentence above the doors.

---

## 10. Decisions (agreed with Agrim, 2026-07-02)

| Decision | Choice |
|---|---|
| Mode-selector redesign | **Option A — Triptych** (three full-height doors, one-click entry, real links, no WebGL on first paint) |
| Fun-mode navbar on phones | **Hamburger menu** ≤640px: pill = logo + theme toggle + 44px menu button; section links in a dropdown sheet. Plus: move Navbar outside the tilt wrapper, make logo a `<button>` |
| Mode names | **Résumé / Portfolio / Terminal** — routes eventually `/resume`, `/portfolio`, `/terminal` with redirects from `/cv`, `/normal` (keep old URLs working; update canonicals + sitemap when switching) |
| Scope | **Plan only for now** — nothing implemented yet; Agrim will review this doc and green-light phases later |

## 11. Status log

- 2026-07-02 — Audit completed (3 parallel reviews + build verification of the globals.css and bundle findings). Navbar clipping diagnosed (§3.2). Decisions above recorded.
- 2026-07-02 — **Phase 5 selector redesign SHIPPED (Option A Triptych).** New `src/features/modeSelection/ui/ModeTriptych.jsx/.css` replaces the arcade HUD; old files deleted (ModeSelector, BioluminescentField, ModePortal, PortalWarp, ChargeRing, CssCosmicField, CssPortal, useWebGL, arcadeSound, rng, useVisitedModes — recoverable via git). Doors are real router `<Link>`s (labels: Résumé/Portfolio/Terminal; routes unchanged for now), one-click entry with 430ms door-grow (instant under reduced-motion), digits 1–3 shortcut without preventDefault, 44px touch targets, `<main>` + h1 landmark, focus-visible rings, mobile stacked rows, `100dvh`. Side effects: landing page no longer downloads three.js at all (index 23.5 KB gzip, was 26.6 + 298 KB three chunk); selector-related audit items S2 (key hijack), M4 (tab misuse), M5 (selector canvases), M8 (legend contrast), R7 (selector targets), U1 (names), U3 (friction), U13, P-C1, P-C2 are resolved by replacement. Verified: `npm run build`, eslint, dev-server module smoke test. Not yet committed.
- 2026-07-02 — **Phases 0–4 SHIPPED** (uncommitted). Summary of what landed:
  - *Phase 0*: "Development" typo fixed; LinkedIn URL unified to `/in/agrim-sigdel-34b532151/` (index.html JSON-LD now matches content.json — **user should confirm this is the right profile**); CV canonical → `/cv`; per-mode SEO added to Portfolio + Terminal; deleted kurama-pointer.png, gojo.png, Preloader, CustomCursor, SnakeBackground, SnakeSquiggle, appConfig.js, globals.css; netlify.toml immutable cache headers.
  - *Phase 1*: globals.css utilities (text-*, mb-*, flex, gap-3, uppercase, tracking-widest, leading-*, opacity-*, sr-only…) migrated into index.css + h3 mobile clamp. Fun-mode typography restored.
  - *Phase 2*: Terminal live region (`role="log"` aria-live) + labeled input; ContactModal focus trap; `MotionConfig reducedMotion="user"` in main.jsx; Squiggle WAAPI gated + aria-hidden; CV contrast `#db5a34`→`#c14a24`, `#888`→`#6b6b6b`; terminal dim/dimmer bumped; `<main>` landmarks in all modes; heading fixes (About h3s, WorkGrid sr-only h2); ticker aria-hidden; required + aria-describedby on all contact forms; ThemeToggle/palette/traffic-light/dock aria-labels; global `:focus-visible` rule; data-cursor attrs removed.
  - *Phase 3*: Navbar rebuilt — pill max-width, hamburger sheet ≤640px, logo is a button, moved OUTSIDE the tilt wrapper (scroll ref hoisted to FunModePage); tilt disabled on `(hover:none)`/reduced-motion (no more skewed mobile page); 100vh→100dvh sweep (Terminal, Hero 150dvh/100dvh, FunModePage, hero-section, ContactModal); 16px form inputs everywhere; 44px touch targets (navbar toggles, modal close); terminal tap-to-type hint + horizontal scroll for ASCII art.
  - *Phase 4*: both `* { transition }` rules scoped; tilt shadow/radius only applied when tilt active; JetBrains Mono via injected `<link>` instead of `@import`; ErrorBoundary + spinner Suspense fallback (no more blank screen on chunk failure); cv-mode 100vw→100%.
  - Verified: build ✓, eslint (35→23 error lines, all 23 pre-existing false positives), dev-server smoke ✓.
- 2026-07-02 — **Round 3 SHIPPED** (user-requested, uncommitted):
  - *Selector shell retheme*: ModeTriptych non-door elements moved off the blue/purple arcade palette to **ink + terracotta** (bg `#0e0d0b` + terracotta radial, cream `#f5f0e8` text, warm-grey `#b3a99a` secondary, terracotta `#e05c34` accents/hovers/focus rings). Doors unchanged.
  - *Fonts*: **Instrument Sans** replaces Inter as `--font-sans` app-wide (Fraunces stays display serif, JetBrains Mono stays terminal). Google Fonts URL trimmed (Fraunces 300–900 upright / 400–600 italic instead of full axes; Inter no longer loaded, kept as CSS fallback name).
  - *Terminal full VFS rebuild*: new `lib/vfs.js` builds a real directory tree from content.json (`~/about.txt`, `skills.txt`, `contact.txt`, `education.txt`, `resume.pdf` binary→/AgrimSigdel-CV.pdf, `experience/*.md`, `projects/*.md`, `research/catd.md` + `catd-paper.pdf` binary). Real `ls/cd/cat/head/open/grep/tree/pwd` with realistic errors (`cat resume.pdf` → binary-file guard pointing to `open`), starship-style cwd prompt `~/projects ❯`, bash-style deliberate Tab completion (ghost text removed), `menu` kept as guided tour teaching real commands, `portfolio`/`cv`/`exit` mode-switch commands, refined IDE-dark chrome (8px grid, slimmed titlebar, cwd status bar, per-second clock removed). All prior a11y work preserved (role=log, labeled input, dvh, touch hint…). Terminal chunk 33.8 kB.
  - Post-test user feedback applied: Tab candidates render in a live role="status" suggestion row below the prompt (filters as you type, hides on no match) instead of printing into the scrollback.
- Still open: route renames (/resume, /portfolio) with redirects; cross-mode switcher (U2); 404 page (U6); Back-button/footer overlap (U8); ThemeContext prefers-color-scheme nit.
- NOTE: user manually edited content.json `intro` to "I build production  and research computer-vision pipelines." — has a double space / possibly missing word; flag to user before deploy.
