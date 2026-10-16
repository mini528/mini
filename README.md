# mini

## Social sharing

The **Share site** and **Share post** buttons open an accessible platform-choice dialog with WhatsApp, Facebook, X, Telegram, LinkedIn, email, the browser's native share sheet, and copy-link actions. WhatsApp is highlighted as the primary option. A post's share preview includes its organization, post text, event details (when present), and a direct link back to the post, formatted with readable line breaks. External sharing opens in a new tab when possible, leaving the site open. Individual member names are not added to the prefilled message; post text itself is included when the user chooses to share it.

The page layout uses a focused central feed, aligned navigation and side content, and responsive spacing for mobile. The share dialog supports keyboard focus, Escape-to-close, and return focus to the button that opened it.

For useful previews, the page includes basic Open Graph and X card metadata. Before launch, host the site on a public HTTPS domain and replace the generic preview metadata with the approved brand description and a branded preview image. Social platforms read preview metadata from the page HTML on their servers, so JavaScript-only metadata changes are not enough.

## Before production

This is a single-file prototype, not a production social-network integration. Its posts and post IDs are in memory, so post links will not be reliable across reloads or devices. Production sharing needs persistent post records, stable public URLs, and server-rendered or edge-generated preview metadata for each shareable page. Do not add social sign-in, platform API credentials, tracking pixels, or automatic cross-posting without a reviewed privacy and child-safety design; use platform-specific APIs only if there is a clear need and appropriate consent.