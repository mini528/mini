# mini

## Social sharing

The prototype's **Share site** button and post share actions offer direct share links for Facebook, WhatsApp, X, Telegram, LinkedIn and email, plus the browser's native share sheet (useful for apps such as Instagram and TikTok) and copy-link fallback. A prominent WhatsApp action on each post opens WhatsApp in a new tab with the organization, post text, event details (when present), and a direct link back to that post, separated with readable line breaks. The original site tab stays open. Individual member names are not added to the prefilled message; post text itself is included when the user chooses to share it.

For useful previews, the page includes basic Open Graph and X card metadata. Before launch, host the site on a public HTTPS domain and replace the generic preview metadata with the approved brand description and a branded preview image. Social platforms read preview metadata from the page HTML on their servers, so JavaScript-only metadata changes are not enough.

## Before production

This is a single-file prototype, not a production social-network integration. Its posts and post IDs are in memory, so post links will not be reliable across reloads or devices. Production sharing needs persistent post records, stable public URLs, and server-rendered or edge-generated preview metadata for each shareable page. Do not add social sign-in, platform API credentials, tracking pixels, or automatic cross-posting without a reviewed privacy and child-safety design; use platform-specific APIs only if there is a clear need and appropriate consent.