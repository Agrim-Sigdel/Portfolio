# Case Study — Discovery Questions

_Prepared 2026-07-09 · to turn the easy-3dkit / interactive-terminal work into a complete, publishable case study._

These are the answers I need from you to write a strong case study. Questions marked
**[I can draft]** I can already answer from the codebase / repo — just confirm or correct
them. The rest only you can answer (motivation, decisions, numbers, outcomes).

Answer inline under each question, or voice-note me and I'll transcribe.

---

## 0. Framing (answer this first — it shapes everything below)

- **What is the case study *about*?** Pick one hero:
  - **A. easy-3dkit** — the open-source React/R3F 3D component library (npm), with the
    portfolio terminal as its interactive live demo. _(My default assumption.)_
  - **B. The interactive terminal portfolio** — the site itself (terminal + fun + normal
    modes), with easy-3dkit as one ingredient.
  - **C. The `fx` backdrop carousel feature** specifically (narrow, deep dive).
- **Where will it live?** (portfolio page, Medium/dev.to, PDF for recruiters, conference
  talk, README?) This sets length and tone.
- **Who's the reader?** (hiring managers / senior eng, other frontend devs, design-eng
  hybrids, potential library users?)
- **What's the one takeaway** you want them to leave with about you?

---

## 1. Origin & context

- What made you start easy-3dkit? A specific pain point, a client need, a learning goal,
  or a portfolio differentiator?
- Had you shipped R3F / shader work before this, or was it new ground?
- Were there existing libraries (drei, react-spring, etc.) you felt were missing
  something? What was the gap you were filling?
- **[I can draft]** What the library *is* — R3F + three.js + GSAP, 21 surface shader
  materials, layouts, components, postprocessing. _(Confirm the elevator pitch in your
  words.)_
- Timeline: when did you start it, and how long to first npm publish → today (v0.3.x)?

## 2. Problem & goals

- What were you explicitly trying to make *easy* that is normally *hard*? (e.g. "drop a
  scroll-reactive shader surface into any React app in 3 lines")
- What were your success criteria at the outset — for yourself, and for users?
- Any non-goals you deliberately scoped out?

## 3. Role & process

- Solo project, or contributors? What exactly was your role/ownership?
- How did you decide the API surface (`<Stage>`, `<InteractiveSurface material={…}>`,
  the "one variant = one effect" pattern)? Was that the first design or an iteration?
- How do you test / QA shader work? (visual regression, manual, a gallery app?)
- Did anything get significantly redesigned mid-flight? (great case-study material)

## 4. The interactive terminal showcase _(the work we just built)_

- **Why a terminal** as the portfolio's "work mode," and why put the live shader backdrop
  behind it?
- What's the intended visitor journey — do you want people to discover `fx`, shuffle
  effects, tweak settings? Is it a toy, a flex, or a genuine library demo?
- **[I can draft]** What we built: `fx` command (all 21 effects, shuffle, auto-rotate),
  a draggable mini-player control window, a phone/closed-state wallpaper control bar,
  and a "made with easy-3dkit" credit. _(Confirm framing / naming.)_
- How important is the mobile/touch experience for this piece?
- Do you want the case study to include the "24 curated → all 21, dark-tuned" decision
  history, or just the final state?

## 5. Technical challenges & decisions (the meat)

- What was the **hardest technical problem** in easy-3dkit? (uniform lifecycle, the
  create-once/mutate-in-loop discipline, WebGL fallback, GSAP↔R3F timing, tree-shaking?)
- **[I can draft]** The performance story: landing FCP was ~4.1s because an object-form
  `manualChunks` pulled ~1MB of three.js onto the entry bundle; the fix keeps three in a
  lazy backdrop chunk. _(I need the **before/after numbers** from you — see §7.)_
- How did you keep the library **tree-shakeable / lightweight**? Any bundle-size targets?
- WebGL isn't universal — how do you handle unsupported / low-power devices? (You have a
  `<Stage fallback>` + `isWebGLAvailable` — say more about the philosophy.)
- Any effect or feature that was disproportionately hard to get right? Which shader
  fought you the most?

## 6. Design & UX

- How did you choose the default look / palettes for the effects?
- The `controls` + `docs` schema on every material — was that always the plan, or did it
  emerge from needing a gallery? What problem does it solve for users?
- Any accessibility considerations? (reduced-motion — you have `usePrefersReducedMotion`;
  color contrast; keyboard nav in the terminal; the `role="log"` / `aria-live` output.)

## 7. Numbers & evidence (recruiters love these — please gather)

Even rough figures make the case study credible:

- **npm:** total/weekly downloads, version count, time to latest (v0.3.x).
- **GitHub:** stars, forks, issues opened/closed, any external contributors or users.
- **Bundle size:** core import gzipped; the lazy three.js chunk size (I have build output:
  StarryNight chunk ≈ 942 kB / 246 kB gzip — confirm what number you want to cite).
- **Performance:** Lighthouse scores (mobile + desktop), FCP/LCP **before vs after** the
  chunking fix, TBT/CLS. (Do you have the "before" numbers, or should I try to reconstruct?)
- **Reach:** any real projects/sites using easy-3dkit besides this portfolio? Testimonials,
  tweets, mentions?
- **Effort:** rough hours/weeks invested, number of effects/components shipped
  (I count 21 surface materials + layouts + components — confirm the totals you want quoted).

## 8. Outcomes & impact

- What are you most proud of about this work?
- Did it lead to anything concrete — a job conversation, a client, a talk, downloads,
  learning you now reuse?
- What did *users* (or you) get out of it that a plain three.js setup wouldn't give?

## 9. Reflection

- What would you do differently if starting over?
- Known limitations / tradeoffs you'd want to be honest about?
- What's on the roadmap for easy-3dkit next? (v0.4+, new effects, docs, SSR?)
- One thing this project taught you that changed how you build things.

## 10. Assets I'll need to assemble it

- Do you have **screen recordings / GIFs** of the effects and the terminal carousel? (A
  10–20s clip of shuffling effects is the money shot.) If not, I can script capture steps.
- Still images / hero shot for the case-study header.
- Any **diagrams** you want (architecture, the FSD layering, the lazy-chunk boundary,
  the "material variant" pattern)? I can generate these.
- Links to include: npm, GitHub, live docs (3d-kit.netlify.app), the live terminal.
- A short bio / one-liner about you for the byline.

---

## Appendix — what I already know (baseline, so you don't repeat it)

- **easy-3dkit**: React library on R3F + three.js + GSAP; author Agrim Sigdel; MIT;
  published to npm; docs at 3d-kit.netlify.app. Public surface: `Stage`, `InteractiveSurface`
  (21 shader materials), particle/instanced/scroll components, layouts, postprocessing,
  WebGL fallback + error boundary, reduced-motion + input-mode hooks.
- **Portfolio**: Vite + React, Feature-Sliced-Design structure, PWA, three modes
  (terminal / fun / normal). The terminal renders a lazy easy-3dkit backdrop.
- **The `fx` feature (just built)**: store-driven carousel of all 21 dark-tuned effects;
  `fx` command family (list/next/prev/shuffle/auto/set/info/reset/panel); draggable
  mini-player window; phone/closed-state wallpaper control bar; on-backdrop credit.
- **Perf constraint honored**: three.js stays in a lazy chunk; the eager terminal bundle
  carries only plain-data control schemas, not three.

---

_Next step: fill in §0 first so I lock the angle, then §5 and §7 (challenges + numbers) —
those two sections carry most of a technical case study. I can turn your answers into a
full draft + supporting diagrams/GIF-capture scripts._
