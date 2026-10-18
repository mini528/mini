# Mini Circles

A fast, mobile-first public website for **Mini Circles**, a youth-led programme of The Mlungisi Mashinini Foundation. It brings reading for fun and sport together under the line **Read. Play. Repeat.**

The website is a static HTML/CSS/JavaScript site with no visitor accounts, public comments, child profiles, tracking pixels, or user uploads. The homepage is the full public-facing organisation showcase, with the programme story, impact figures, team league table, term event calendar, partner names, story highlights, safeguarding promise and audience-specific calls to action. Full reference details are also organized into clean-URL tabs: `/programmes/`, `/events/`, `/resources/`, `/about/`, `/get-involved/`, and the public professional dashboard at `/professionals/`. Original graphic-novel-inspired shapes add a playful edge while keeping the site professional; no third-party characters or artwork are used. Run the site behind any static web server from the repository root; the Mini League and event details are loaded from `data/mini-league.csv` and `data/events.json`, so opening `index.html` directly as a `file://` URL will not load them.

## Volunteer editing

- Edit the term-by-term event titles, dates and locations in `data/events.json`. Leave a date as `null` until it is confirmed; the calendar download remains disabled until then.
- Update fixtures and scores in `data/mini-league.csv`. Keep the header row. Use ISO dates (`YYYY-MM-DD`) and leave both score cells empty until a match is played. The site calculates a team table from results (3 points for a win, 1 for a draw).
- Update programme descriptions and league information in `programmes/index.html`.
- Update event stories in `events/index.html`, and term event details in `data/events.json`.
- Update FAQs, the programme story and privacy information in `about/index.html`.
- Update the professional dashboard content and planned tool areas in `professionals/index.html` as tool requirements are confirmed.
- Update enquiry options in `get-involved/index.html`.
- Replace the illustrated gallery placeholders only with approved photographs; obtain guardian consent and do not publish children's full names or identifying details.
- The printable session cards and welcome guide are standalone HTML files in `resources/`; print them from a browser. The year plan is a spreadsheet-friendly CSV.

## Contact and forms before launch

The website uses the provided WhatsApp number and Facebook page. The team email, form endpoint, Instagram profile and canonical public domain still need confirmation. Set or confirm these values near the start of `assets/site.js` in `MINI_CIRCLES_CONFIG`:

- `whatsappNumber`: international digits only, without `+` or spaces (for South Africa, start with `27`).
- `teamEmail`: the approved team inbox.
- `formEndpoint`: a same-origin or approved HTTPS form endpoint that accepts `multipart/form-data`, returns a successful HTTP response, and is configured to send an acknowledgement to the submitter. Use a provider with spam filtering as well as the built-in honeypot, and test delivery and the auto-reply before publishing.

Until the form endpoint is set, the forms explain that enquiries are not connected and direct people to WhatsApp. Do not collect sensitive child information. Add the verified team contact for privacy requests before launch.

## Publishing checklist

1. Confirm the official public domain, Foundation contact details, social profile URLs, locations, languages and event dates.
2. Configure and test the form endpoint, spam filtering, team notification and automatic thank-you email.
3. Add the confirmed term dates to `data/events.json`; calendar downloads and WhatsApp shares are generated for each event.
4. Publish the site over HTTPS. Set the absolute Open Graph image URL in `index.html`, then generate `sitemap.xml` with `python3 tools/generate_sitemap.py https://your-confirmed-domain`. The sitemap includes each public detail page. A public domain was not provided, so no unverified domain is embedded here.
5. Review POPIA wording and safeguarding arrangements with the Foundation. Keep the two-adult-at-every-session standard and guardian photo consent in place.

Ubuntu is loaded from Google Fonts. If the site needs to avoid third-party font requests, self-host licensed font files and remove the Google Fonts links from each page.
