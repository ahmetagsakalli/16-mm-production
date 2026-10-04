# 16mm Production — 4 October 2026 production update

- URL: https://16mm-production.vercel.app/
- Target: production
- Status: READY, promoted after isolated deployment validation
- Account/team: ahmetagsakalli / guncel-yayin
- Project: 16mm-production (`prj_KodCtqSgfsDuq0BMJjS0uZ7xFtHS`)
- Deployment: `dpl_DFPqH3gf6eqXKchdMDuV3b4X2Vg7`
- Artifact: https://16mm-production-74coz00ak-guncel-yayin.vercel.app
- Framework: Next.js 16.3.5; cloud build completed in 57 seconds, 51 pages
- Source: local workspace; no Git push performed in this deployment
- Previous production, available for rollback: `dpl_7iBADBo246okFc8byU3iwktJsXfX`

## Data preservation

Production CMS export backed up privately before deployment. Before/staged/after exports match exactly after sorting database rows and omitting only export timestamp:

- 31 projects, including drafts, published values, order, titles and source folders
- 673 photos + 1 video (674 media records)
- 52 revisions
- All site settings unchanged
- Canonical SHA-256: `4921ab8400be6d603b3d538f51b36c3cbc5561879a34c2f13e5e1cca91c9e121`

Private backups: `.data/backups/production-2026-10-04/`. These are excluded from deployment. No database migration, seed, settings change, password reset or upload replacement was run. Existing authenticated admin session and export remained operational across deployment. Our verification session was logged out after checking.

Environment IDs and targets stayed unchanged. Existing Turso database and Blob storage are still used. The older ozan-b-portfolio project was not changed.

## Packaging corrections

The dry-run caught the Talking Head exception not including its files; `.vercelignore` now explicitly includes all 114 prepared WebP files. The private archive restored 3,933 existing files with matching checksums during build.

The first isolated build stopped before promotion because the excluded originals directory was present but empty. Cloud portfolio preparation now validates the 42 prepared identity/home assets and returns without regenerating content. A regression test confirms it leaves manifests/assets unchanged and rejects missing responsive variants. No failed build was promoted.

## Validation

- CMS tests: 9/9 passed in isolated local storage with cloud variables unset.
- Build preservation regression: 1/1 passed.
- ESLint for deployment-script edits passed.
- Cloud TypeScript check and production build passed.
- 860 public URL checks passed: CMS media, video/preview, Talking Head variants, identity/home assets, project/category routes, admin and metadata. Legacy `/portfolio/events` returns the intended 308 to `/portfolio/exhibitions`.
- Browser: desktop 3-column product grid (104 photos), enlarge, next, close; working contact anchor, white form background, oval sidebar CTA, Google map.
- Mobile 390×844: automatic home slideshow loaded with contain fit, selected projects and responsive menu; contact form has no horizontal overflow.
- Home counter/pause control absent; navigation and automatic slideshow remain.
- WhatsApp form destination inspected; no message submitted.
- Runtime error scan for the new deployment: no error entries returned. Browser console: no errors returned. This is point-in-time verification; continuous monitoring/drains were not changed.

Proof: `reports/live-update-2026-10-04.jpg`.
