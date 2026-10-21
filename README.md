# The Mlungisi Mashinini Foundation

A fast, mobile-first public website for **The Mlungisi Mashinini Foundation** and its youth program, Mini Circles. It brings literacy, sport and leadership together under the line **Read. Play. Grow. Lead.**

The website is a static HTML/CSS/JavaScript site with no public child accounts, comments, tracking pixels, or user uploads. Its Foundation homepage covers the mission, literacy and sport, leadership, impact stories, events, volunteer opportunities, partnerships, photo gallery, program-interest form, and donation pledges. Real Foundation photos are managed through `data/homepage-media.json`; empty slots remain clearly labelled until approved photographs are supplied. The pledge form does not process payments, and enquiry forms remain inactive until a secure form endpoint is configured.

The stakeholder directory and standardized profile pages are available at `/stakeholders/`; partner profile editing and sign-in live at `/professionals/`. These features require Supabase Auth and the row-level-security migration described below. Public self-registration is not implemented. Mini Circles program and reference details remain available at `/programmes/`, `/events/`, `/resources/`, `/about/`, and `/get-involved/`. Run the site behind any static web server from the repository root; unless Supabase is configured, Mini League and event details load from `data/mini-league.csv` and `data/events.json`, and the stakeholder directory uses the local seed profiles.

## Content repository

Term events and Mini League fixtures/results can be served from Supabase. The migration in `supabase/migrations/` creates the tables, seeds the four current term events, and allows public read-only access to records marked as published. It does not store children's personal information, and the public website cannot create, update, or delete records.

To connect a Supabase project:

1. Apply the migration with the Supabase CLI (`supabase link --project-ref YOUR_PROJECT_REF`, then `supabase db push`), or run the migration SQL in the project's SQL Editor.
2. Copy the project's Project URL and anon key into `supabaseUrl` and `supabaseAnonKey` in `assets/site.js`. These are public browser credentials; never put a service-role key in the site.
3. Add and edit events and league fixtures in the Supabase Table Editor. Set `is_published` to `true` when a record is ready to appear on the public site. Keep unpublished or draft records private.

Until both Supabase values are configured, the site continues to load `data/events.json` and `data/mini-league.csv`, so local previews and existing deployments keep working. Once configured, Supabase is the source for both event and league data; a failed Supabase request is shown as unavailable rather than silently switching to stale local data.

## Stakeholder dashboard setup

The migration `supabase/migrations/20261021120000_stakeholder_profiles.sql` creates stakeholder profiles and memberships, seeds the three supplied organizations, and limits profile changes to authenticated owners and editors through row-level security. Only published profiles are visible publicly. Users can view their own memberships; public self-registration and membership changes from the website are not allowed.

1. Apply both Supabase migrations and configure the Project URL and public anon key in `assets/site.js`.
2. Disable public sign-ups in Supabase Auth. Invite or create stakeholder users from the Supabase dashboard after verifying their organization.
3. Add a membership for each approved user in the Supabase SQL Editor. Use the profile UUID from the Table Editor and assign only the appropriate role:

   ```sql
   insert into public.stakeholder_memberships (user_id, stakeholder_id, role)
   values ('AUTH_USER_UUID', 'STAKEHOLDER_PROFILE_UUID', 'owner');
   ```

   Supported roles are `owner`, `editor`, and `viewer`. Only owners/editors can update profile content; publication state and membership roles remain administrator-controlled.
4. Serve the site over HTTPS in production and test sign-in, sign-out, session expiry, public profile visibility, and role restrictions with non-production accounts before inviting partners.

Profile editors can update text, public contact fields, programs, news, and photo/video gallery entries. Owners and editors can upload JPEG, PNG or WebP images up to 10 MB into the public stakeholder-media bucket. Public bucket images are accessible to anyone with the URL, so upload only media approved for publication; add descriptive alt text and captions to gallery entries. Videos are added as approved HTTPS links using gallery JSON entries with `"type": "video"`.

## Volunteer editing

- Before Supabase is configured, edit event titles, dates and locations in `data/events.json`; leave a date as `null` until confirmed. After connecting Supabase, manage events in its Table Editor instead.
- Before Supabase is configured, update fixtures and scores in `data/mini-league.csv`; keep the header row, use ISO dates (`YYYY-MM-DD`), and leave both score cells empty until a match is played. After connecting Supabase, manage fixtures/results in its Table Editor. The site calculates a team table from results (3 points for a win, 1 for a draw).
- Update programme descriptions and league information in `programmes/index.html`.
- Update event stories in `events/index.html`, and term event details in `data/events.json`.
- Update FAQs, the programme story and privacy information in `about/index.html`.
- Update the professional dashboard content and planned tool areas in `professionals/index.html` as tool requirements are confirmed.
- Update enquiry options in `get-involved/index.html`.
- Add approved photo files to `assets/images/` and update `data/homepage-media.json`; obtain guardian consent and do not publish children's full names or identifying details. See `assets/images/README.md` for the photo key list and image guidance.
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
3. Add confirmed term dates to `data/events.json` or the Supabase events table, depending on the configured data source; calendar downloads and WhatsApp shares are generated for each event.
4. Publish the site over HTTPS. Set the absolute Open Graph image URL in `index.html`, then generate `sitemap.xml` with `python3 tools/generate_sitemap.py https://your-confirmed-domain`. The sitemap includes each public detail page. A public domain was not provided, so no unverified domain is embedded here.
5. Review POPIA wording and safeguarding arrangements with the Foundation. Keep the two-adult-at-every-session standard and guardian photo consent in place.

Ubuntu is loaded from Google Fonts. If the site needs to avoid third-party font requests, self-host licensed font files and remove the Google Fonts links from each page.
