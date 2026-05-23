# Solara Pool Service — Marketing Website

Static marketing site for Solara Pool Service (Houston, TX). Vanilla HTML / CSS / JS bundled with Vite, deployed to Netlify.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

Requires Node 18+ and npm.

## Project structure

```
index.html              Main landing page
public/free-month.html  Ad-only landing page (noindex)
public/_headers         Netlify security headers
public/robots.txt
public/sitemap.xml
src/main.js             Carousel, mobile menu, language toggle, form handler
src/i18n.js             EN / ES translation strings
src/style.css           All styles
```

## Integrations

| What                | Where                                                                 | Owner                              |
| ------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| Hosting             | Netlify (siteId in `.netlify/state.json`)                             | Client                             |
| Domain              | GoDaddy → `solarapoolservice.com`                                     | Client                             |
| Email               | `info@solarapoolservice.com` (GoDaddy mailbox)                        | Client                             |
| Form submissions    | Google Apps Script endpoint hardcoded in `src/main.js`                | Client (Apps Script + Sheet)       |
| Phone (call/SMS/WA) | `(832) 388-7224` hardcoded in HTML                                    | Client                             |
| Instagram           | `https://www.instagram.com/solarapoolservice` (footer)                | Client                             |
| Facebook            | **TODO** — currently `href="#"` placeholder in footer                 | Pending client URL                 |

### Form submissions (Google Apps Script + Sheet)

The contact form on `index.html` POSTs to a Google Apps Script web app endpoint defined as `SHEETS_ENDPOINT` in `src/main.js`. The Apps Script writes each submission as a row in a Google Sheet owned by the client.

**Notes:**

- The endpoint URL is intentionally public — Apps Script web apps are designed to accept anonymous POSTs. Anyone with access to the bundled JavaScript can see and call it.
- Spam protection is currently a **client-side honeypot only** (`name="website"`). Most spam bots will be caught, but a determined attacker could spam the sheet.
- **Recommended hardening (server side, in the Apps Script):**
  - Reject payloads missing `name` or `phone`.
  - Validate phone has ≥ 7 digits.
  - Rate limit per IP or per minute.
  - Optionally check the `Origin` header equals `https://solarapoolservice.com`.
- The form on `public/free-month.html` is **not yet wired** to the Apps Script endpoint — its submit handler currently just fakes success without persisting the lead. This must be wired before driving paid ad traffic to it.

## SEO

- `index.html` has full meta tags, OpenGraph, Twitter card, and JSON-LD `HomeAndConstructionBusiness` schema with service area, hours, and offer catalog.
- Google Search Console verification is via meta tag in `index.html`.
- `public/free-month.html` is marked `noindex` and `canonical` to the main page so it doesn't dilute SEO.
- `public/sitemap.xml` lists only `/`. `public/robots.txt` disallows `/free-month.html`.

## Security headers

Set via `public/_headers` (Netlify file-based headers). Currently set:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (only takes effect once the domain is on HTTPS)

A Content Security Policy is intentionally **not** set yet — it would need to allow the Apps Script POST and any future analytics/fonts. Add it in `_headers` after testing in `Content-Security-Policy-Report-Only` mode on a staging URL.

## Deployment

The site auto-deploys from the connected repo via Netlify on every push to the default branch. Build settings (build command `npm run build`, publish directory `dist/`) are managed in the Netlify dashboard.

## Maintenance

| To change…                       | Edit…                                                                |
| -------------------------------- | -------------------------------------------------------------------- |
| English copy                     | `src/i18n.js` (EN block) and `data-i18n` keys in HTML                |
| Spanish copy                     | `src/i18n.js` (ES block)                                             |
| Phone number                     | Search for `8323887224` across `index.html` and `src/main.js`        |
| Form destination                 | `SHEETS_ENDPOINT` constant in `src/main.js`                          |
| Service area / business hours    | JSON-LD `schema.org` block in `<head>` of `index.html`               |
| Reviews                          | `<article class="review">` blocks in `index.html` + `rev*` in i18n   |
| Hero photo                       | `public/pool-bg.jpg`                                                 |
| Service card photos              | `public/service-clean.jpg`, `public/service-algae.jpg`               |

## Things that are .gitignored

- `node_modules/`, `dist/`, `.netlify/` (regenerated locally)
- `.env`, `*.key`, `*.pem` (no real ones currently exist)
- `form-responses.csv` (any local lead exports)
- `moodboard*.pdf` (design reference, large file)
- `.claude/`, `.agents/`, `AGENTS.md` (AI tooling configs)
- `fondo/` (AI-generated reference images)

## Pre-launch manual checklist

See the most recent hardening report for the prioritized list. High-level:

1. **Run `npm install`** to sync the lockfile after the dependency cleanup in this commit.
2. **Run `npm audit fix`** to patch the moderate `postcss` CVE and the high `vite` dev-server CVEs.
3. **Wire `public/free-month.html` form to the same Apps Script endpoint** (or accept that those leads are lost).
4. **Add server-side validation in the Apps Script** (see "Recommended hardening" above).
5. **Decide on the Facebook social link** in the footer of `index.html` — currently `href="#"`.
6. **Connect the custom domain in Netlify and update GoDaddy DNS** — A record `@ → 75.2.60.5`, CNAME `www → <site>.netlify.app`. Leave existing MX records untouched so `info@solarapoolservice.com` keeps working.
7. **Add a privacy policy page** if/when collecting EU traffic. The footer currently says "We respect your privacy" but no policy page exists.
8. **Real-device test on iPhone Safari and Android Chrome** for the contact form, language toggle, mobile menu, and reviews carousel.
9. **Rotate the GoDaddy password** if it was ever shared in plain text.
