# Content management update

The duplicate Gallery navigation is removed; its URL redirects to Projects. Each project keeps its existing media, cover and draft/publish history. A prominent cover preview opens a photo picker without changing the project until Save/Publish.

A separate Home page editor stores ordered photo IDs and project IDs. Initial selection follows the current exact home photos and featured projects. Selected project cards appear beneath the slideshow on desktop and mobile; slideshow photo selection is independent. Saved selections use existing published, visible photos; unpublishing/hiding a source removes it from public output without deleting its record. Public selection resolves stable IDs and preserves prepared high-resolution home assets.

Blog gets list/editor/preview, draft save, publish, unpublish, recoverable trash, optimistic version checks, cover selection from existing published gallery and automatic stable addresses. Five original Turkish photography articles are inserted once by an explicit additive migration. No existing project/settings/media/credential data is overwritten. The existing photo upload path and WebP conversion remain in Projects.

Only additive homepage/blog/migration tables; migration uses CREATE IF NOT EXISTS and a transactional marker. Production export before/after proves core content unchanged. Export includes the new content for future backups.

Security: existing admin session and same-origin guard protect every new API operation. Validate strict schemas, lengths, IDs and public cover eligibility server-side; SQL parameters throughout. Render text as React text nodes (no raw HTML). New/public cache invalidation follows the existing cms tag and layout path. Conflicts return 409; hidden/draft assets never leak to public pages.

Acceptance: no duplicate Gallery menu; old link redirects; cover selection saves/publishes; home photo/project selection is ordered and persistent; published-only blog with 5 initial articles; edit/draft/preview/publish/unpublish/trash/restore work; initial migration is idempotent; tests isolate storage; desktop/mobile browser verification; production build succeeds.
