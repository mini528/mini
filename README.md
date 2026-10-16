# Mini Circle

The site uses the Mini Circle name and the supplied brand direction: a turquoise-to-blue gradient with red and yellow overlapping arcs. The reusable vector logo is [`mini-circle-logo.svg`](./mini-circle-logo.svg); the application applies the same blue/cyan palette to controls and highlights. The platform keeps its sport, reading, and learning community purpose under this brand.

## Social sharing

The **Share site** and **Share post** buttons open an accessible platform-choice dialog with WhatsApp, Facebook, X, Telegram, LinkedIn, email, the browser's native share sheet, and copy-link actions. WhatsApp is highlighted as the primary option. A post's share preview includes its organization, post text, event details (when present), and a direct link back to the post, formatted with readable line breaks. External sharing opens in a new tab when possible, leaving the site open. Individual member names are not added to the prefilled message; post text itself is included when the user chooses to share it.

The page uses a light, responsive social-feed layout with five main destinations: Home, Explore, Matchday, Courses, and You. Library and Events are accessible from Explore; Alerts are in the top bar. On phones, navigation stays in a safe-area-aware bottom bar, the header truncates long titles instead of overflowing, post actions remain tappable, tables scroll horizontally, and course/organization grids collapse to one column. Feeds reveal posts in batches instead of rendering an ever-growing list. The share dialog supports keyboard focus, Escape-to-close, and return focus to the button that opened it.

## Audience and feed relevance

The home and Explore pages explain the value for young people, parents, schools/clubs, and the wider community. The “For you” feed has editable Sport, Reading, Learning, Events, and Opportunities interests. It ranks posts using those explicit choices plus groups followed or joined in the current session; newer posts stay ahead when relevance is tied. It does not rank by popularity or infer sensitive traits. Interest choices are stored in this browser only. This is a transparent prototype rule, not a production recommendation service.

The product position is a trusted, organized community for sport, reading, and learning: professional organization pages and communications, with playful matchday energy rather than an endless feed. The stakeholder guide is explicit that child-safety reporting, staffed moderation, verified role workflows, consent, and privacy compliance must be built and reviewed before a public launch.

## Prototype content storage and growth

Community posts, demo organizations, and feed interests are saved in browser storage (up to the latest 250 posts) and restored after refresh on that same browser. This is a prototype convenience, not shared storage: posts are not synchronized between visitors or devices, browser data can be cleared, and the browser is not a secure database. The demo profile, follows, and learning progress are not connected to real user accounts. Do not store private information or use this storage for real children's accounts.

The Supabase schema foundation is in [`supabase/migrations/20261016000000_community_foundation.sql`](./supabase/migrations/20261016000000_community_foundation.sql). It creates verified organizations, private member approval status, moderation-first posts and comments, member reports, feed indexes, and per-account submission limits. Public clients can only read published content; posting requires an authenticated, approved account and creates pending content. Review/publishing and approval require a trusted Supabase administrator. The app is not connected to this schema yet.

Before opening the service to a growing user base, configure a Supabase project, apply and test the migration, and connect a reviewed sign-in and parent/guardian-consent flow. Add object storage plus a CDN for approved video and image uploads, backups and retention controls, audit logs, and accessibility/performance monitoring before turning on user-generated media. Keep sharing user-initiated and avoid importing contacts or sending unsolicited messages. This repository is currently a static HTML prototype and contains no project URL, publishable key, auth flow, deployment configuration, or database connection; do not add a service-role key to the browser.

For useful previews, the page includes basic Open Graph and X card metadata. Before launch, host the site on a public HTTPS domain and replace the generic preview metadata with the approved brand description and a branded preview image. Social platforms read preview metadata from the page HTML on their servers, so JavaScript-only metadata changes are not enough.

## Before production

This is a single-file prototype, not a production social-network integration. Posts persist only in the current browser, so IDs and links are not shared or dependable across visitors and devices. Organization announcements and course notifications are also prototype-local; they do not deliver to other users. Production sharing needs server-side persistent post records, stable public URLs, and server-rendered or edge-generated preview metadata for each shareable page. Do not add social sign-in, platform API credentials, tracking pixels, or automatic cross-posting without a reviewed privacy and child-safety design; use platform-specific APIs only if there is a clear need and appropriate consent.