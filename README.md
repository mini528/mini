# mini

## Social sharing

The **Share site** and **Share post** buttons open an accessible platform-choice dialog with WhatsApp, Facebook, X, Telegram, LinkedIn, email, the browser's native share sheet, and copy-link actions. WhatsApp is highlighted as the primary option. A post's share preview includes its organization, post text, event details (when present), and a direct link back to the post, formatted with readable line breaks. External sharing opens in a new tab when possible, leaving the site open. Individual member names are not added to the prefilled message; post text itself is included when the user chooses to share it.

The page uses a light, responsive social-feed layout with five main destinations: Home, Explore, Matchday, Courses, and You. Library and Events are accessible from Explore; Alerts are in the top bar. Feeds reveal posts in batches instead of rendering an ever-growing list. The share dialog supports keyboard focus, Escape-to-close, and return focus to the button that opened it.

## Prototype content storage and growth

Community posts are saved in browser storage (up to the latest 250 posts) and restored after refresh on that same browser. This is a prototype convenience, not shared storage: posts are not synchronized between visitors or devices, browser data can be cleared, and the browser is not a secure database. Do not store private information or use this storage for real children's accounts.

Before opening the service to a growing user base, connect the app to a reviewed backend with authentication and role-based access, a relational database for accounts/groups/posts/events, object storage plus a CDN for approved video and image uploads, backups and retention controls, and server-side moderation/reporting. Add rate limits, consent and age safeguards, audit logs, and accessibility/performance monitoring before turning on user-generated media. Keep sharing user-initiated and avoid importing contacts or sending unsolicited messages. The repository is currently a static HTML prototype and has no backend, deployment configuration, or database credentials; select and configure a service before implementing shared production accounts and storage.

For useful previews, the page includes basic Open Graph and X card metadata. Before launch, host the site on a public HTTPS domain and replace the generic preview metadata with the approved brand description and a branded preview image. Social platforms read preview metadata from the page HTML on their servers, so JavaScript-only metadata changes are not enough.

## Before production

This is a single-file prototype, not a production social-network integration. Its posts and post IDs are in memory, so post links will not be reliable across reloads or devices. Production sharing needs persistent post records, stable public URLs, and server-rendered or edge-generated preview metadata for each shareable page. Do not add social sign-in, platform API credentials, tracking pixels, or automatic cross-posting without a reviewed privacy and child-safety design; use platform-specific APIs only if there is a clear need and appropriate consent.