# Case-study capture notes — October 2026

The existing ten project IDs, slugs, order, and featured flags are retained. Each case study has a feature-scope overview and at least three walkthrough steps; Kingsoft CRM has six. Thirty local image assets accompany the steps; diagrams explain the remaining processing stages.

## Capture sources

| Existing project | Source | What the images establish |
| --- | --- | --- |
| Feriaau | Public feriaau.com; `Work/Loyalty-System/my-master-project/frontend-web` | Public homepage, original vendor dashboard and customer-drilldown components. Dashboard rendered in an isolated harness with fictional records and sample figures. No production API or customer data used. |
| peeq | Public peeq.fashion, corresponding source in `Personal/pahiran` | Landing page, garment detail, and try-on entry. No photo upload or generated try-on result. |
| Partweave | `Personal/base/apps/website` | Local landing page and creating-projects documentation. CLI `plan` also inspected; generation sequence is an explanatory diagram. |
| easy-3dkit | Public 3d-kit.netlify.app, source in `Personal/easy-3dkit` | Documentation and live gallery with the Iridescent effect selected. |
| Kingsoft CRM | `Work/kingsoft-CRM` | Original Django templates and static JavaScript: contacts, filters, edit form, deals board, lower organisation navigation, and Sidebar Control. The fixture reads all 20 menu entries from `seed_dynamic_sidebar.py`: 16 organisation entries in the Owner view and four separate Superadmin entries. Fake records and UI session state stay local; no production data or permissions changed. |
| ANPR + Smart Parking | `Personal/Parking-Management/ANPR-Parking/frontend` | Original Next.js dashboard, active sessions, manual entry. Local fixture API supplies sample values and DEMO plates. Dashboard percentages are not research evaluation results. |
| Reddit Sentiment Analysis | `Personal/Sentiment-Analysis` | Original Flask/Jinja analysis and leaderboard templates. Leaderboard communities and scores are illustrative fixtures; inference was not executed. |
| ContractorOps AI | `Work/contractorOps-AI/contractorops_redesign.html` | Existing interactive design prototype: overview, quotes, proposal detail. Built-in demo records. **Not captures of the Expo app.** Native app source was reviewed, but the web preview compilation stalled; prototype status is explicit in every caption. |
| Feriaau App | [Published App Store listing](https://apps.apple.com/np/app/feriaau/id6764230718) | Publisher’s consumer-app screenshots: vendor map, vendor page, points balance. Original responsive image assets, not newly generated mockups. Vendor source is in `Work/Feriaau-Vendor`; no vendor-app screenshot is claimed. |
| Personal Portfolio | This repository | Mode selection, visual mode, terminal command output. |

Project sources were inspected read-only. Preview adaptations and fixtures lived under `/tmp/portfolio-capture`, with environment files excluded. They are not part of the portfolio or the original projects.

## Editing and release

- Content: `src/data/content.json`, in `common.projects[].caseStudy.walkthrough`.
- Images: `public/projects/<existing-slug>/`.
- The admin editor supports walkthrough introductions, ordered steps, captions, alt text, media, and optional diagrams.
- Validation checks step copy and accessible media descriptions. The publishing script counts walkthrough media in its loss-prevention check.
- The application hydrates from live Supabase content when configured. The production release uses Netlify for code and screenshot assets, followed by Supabase CMS publication. The release preparation compared the live content with this branch, retained the current personal/profile content, and preserved all ten project identities. The previous CMS row is snapshotted to `content_history` before publication, with a timestamp check to prevent overwriting concurrent edits.
- Local preview was run with the Supabase environment variables blank so the rewritten bundled content could be reviewed.

## Verification

Production build and ESLint on changed feature files pass. Content validation confirms the same ten project identities, at least three steps each, media alt text, and local asset existence. Browser checks cover native-dialog focus, Escape dismissal and scroll restoration, walkthrough anchors, and phone/tablet layouts at 390/768px in a responsive iframe harness. Full repository lint has pre-existing failures in unrelated components.

The feature review distinguishes source-backed scope from screenshot coverage. Partweave’s RBAC, rate-limit, audit-log, and workflow-engine modules remain explicitly planned, matching its feature catalogue. No claim is made that the captures exercise every feature or verify every integration.
