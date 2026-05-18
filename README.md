<!-- SPDX-License-Identifier: MIT -->

<p align="center">
  <img src="./assets/bamidele-aly-studio.webp" alt="Bamidele Aly" width="128" />
</p>

<h1 align="center">bamidelealy.github.io</h1>

<p align="center">
  A static personal site for Bamidele Aly, covering AI model risk
  governance, applied AI in finance, West African economic history,
  and creative practice.
</p>

<p align="center">
  <a href="https://github.com/sebastienrousseau/bamidelealy.github.io/actions"><img src="https://img.shields.io/github/actions/workflow/status/sebastienrousseau/bamidelealy.github.io/pages%2Fpages-build-deployment?style=for-the-badge&label=deploy&logo=github" alt="GitHub Pages deploy" /></a>
  <a href="https://github.com/sebastienrousseau/bamidelealy.github.io/blob/main/README.md"><img src="https://img.shields.io/badge/license-MIT-66c2a5?style=for-the-badge" alt="License: MIT" /></a>
  <a href="https://www.w3.org/WAI/WCAG22/quickref/"><img src="https://img.shields.io/badge/WCAG_2.2-AA%2FAAA-fc8d62?style=for-the-badge" alt="WCAG 2.2 AA / AAA" /></a>
  <a href="#engineering"><img src="https://img.shields.io/badge/no_build_step-zero_deps-1d1d1f?style=for-the-badge&logo=html5&logoColor=white" alt="No build step, zero deps" /></a>
  <a href="https://bamidelealy.com/"><img src="https://img.shields.io/badge/live-bamidelealy.com-0071e3?style=for-the-badge" alt="Live site" /></a>
</p>

---

## Contents

**Getting started**

- [Install](#install) — clone, serve, deploy
- [Quick Start](#quick-start) — edit a page, add an entry to search

**The site**

- [Pages](#pages) — six canonical pages, a notes section with three essays, a `/thanks/` confirmation, and a `/404.html`
- [Locales](#locales) — English (canonical), French at `/fr/`, German at `/de/`, with translated slugs
- [Architecture](#architecture) — file layout, no-build philosophy
- [Design system](#design-system) — Apple-inspired tokens, typography, layers

**Features**

- [Search](#search) — Cmd/Ctrl+K palette with fuzzy match across all pages, locale-aware
- [Theme](#theme) — OS-aware light/dark with persistence, no flash
- [Language selector](#language-selector) — EN/FR/DE dropdown in the header
- [Architecture diagram](#architecture-diagram) — lazy-loaded Mermaid flowchart
- [Contact form](#contact-form) — Formspree intake with mailto fallback
- [Internationalisation](#internationalisation) — three locale trees with reciprocal `hreflang`

**Engineering**

- [Performance](#performance) — Core Web Vitals on a static budget
- [Accessibility](#accessibility) — WCAG 2.2 AA target size, AAA contrast
- [Security](#security) — strict CSP, no plain-text email, no trackers
- [SEO and AI discovery](#seo-and-ai-discovery) — JSON-LD `@graph`, sitemap, `llms.txt`
- [Deployment](#deployment) — GitHub Pages, custom domain via `CNAME`
- [Development](#development) — local server, audit recipes

**Operational**

- [License](#license)

---

## Install

### Clone

```bash
git clone https://github.com/sebastienrousseau/bamidelealy.github.io.git
cd bamidelealy.github.io
```

### Serve locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. No build step, no Node toolchain, no
dependencies to install. The site is hand-authored HTML, CSS and vanilla
JavaScript, gzip-served via GitHub Pages.

### Deploy

Push to `main` on a repository named `bamidelealy.github.io`. GitHub
Pages rebuilds in ~30 s. For a custom apex domain see
[Deployment](#deployment).

---

## Quick Start

To change a page heading or body copy, open the relevant `*.html` and
edit between `<h1>` and `</h1>` (or the surrounding `<section>`). Save.
Push. GitHub Pages rebuilds.

To add a new searchable page:

1. Copy `studio.html` (smallest content page) to `mypage.html` and
   rewrite the content. Keep the `<head>` block intact so CSP,
   JSON-LD, theme bootstrap, the language selector and the search
   overlay travel with it.
2. Add an entry to `search-data.json` **inside `index.en`**:

   ```json
   { "t": "My page", "d": "Short description", "u": "mypage.html" }
   ```

   Then add the translated entries to `fr/search-data.json` (under
   `index.fr`) and `de/search-data.json` (under `index.de`).
3. Create the FR sibling at `fr/<translated-slug>.html` and the DE
   sibling at `de/<translated-slug>.html`. Add reciprocal
   `<link rel="alternate" hreflang>` tags to all three.
4. Add the three URLs to `sitemap.xml` with a sensible `<priority>`,
   each carrying `<xhtml:link rel="alternate" hreflang>` entries for
   the other two locales.

No build, no SSR, no rehydration — refresh the browser.

---

## Pages

| Page | What it covers |
|---|---|
| `index.html` | Home — engineering trustworthy AI for global finance. |
| `projects.html` | Ile Owo eight-agent IFRS advisory system + geospatial risk. |
| `historian.html` | West African monetary systems, publications, education. |
| `studio.html` | Watercolour, Chinese painting, gouache, printmaking. |
| `contact.html` | Curated intake form (Formspree) for speaking and advisory. |
| `notes/index.html` | Long-form notes index — three editorial essays with scroll-snap chapters. |
| `notes/ile-owo-design.html` | Why eight agents, and not one chatbot. |
| `notes/ai-governance-as-road.html` | Governance is the road, not the speed bump. |
| `notes/bank-of-biafra-project.html` | Emergency money and counter-money, 1967–1970. |
| `thanks/index.html` | Post-submission confirmation, `noindex, follow`. |
| `404.html` | Tri-lingual not-found page; language picked from URL prefix. |
| `about.html` | Legacy compatibility redirect to `historian.html`. |

Each EN page has a French sibling under `fr/` and a German sibling
under `de/` — see [Locales](#locales) for the slug map.

---

## Locales

The site ships in three locales — English (canonical), French and
German. Each locale uses translated slugs so the URLs read naturally
in their language.

| EN canonical | FR canonical | DE canonical |
|---|---|---|
| `/` | `/fr/` | `/de/` |
| `/projects.html` | `/fr/projets.html` | `/de/projekte.html` |
| `/historian.html` | `/fr/historienne.html` | `/de/historikerin.html` |
| `/studio.html` | `/fr/atelier.html` | `/de/atelier.html` |
| `/contact.html` | `/fr/contact.html` | `/de/kontakt.html` |
| `/notes/` | `/fr/notes/` | `/de/notizen/` |
| `/notes/ile-owo-design.html` | `/fr/notes/conception-ile-owo.html` | `/de/notizen/ile-owo-konzept.html` |
| `/notes/ai-governance-as-road.html` | `/fr/notes/gouvernance-ia-comme-route.html` | `/de/notizen/ki-governance-als-strasse.html` |
| `/notes/bank-of-biafra-project.html` | `/fr/notes/projet-banque-biafra.html` | `/de/notizen/projekt-bank-von-biafra.html` |
| `/thanks/` | `/fr/merci/` | `/de/danke/` |
| `/about.html` | `/fr/a-propos.html` | `/de/ueber.html` |
| `/404.html` | `/fr/404.html` | `/de/404.html` |

Every indexable page declares `<link rel="alternate" hreflang>` for
`en-GB`, `fr-FR`, `de-DE` and `x-default`. The sitemap mirrors this
with `xhtml:link` alternates. Each locale has its own
`search-data.json` and `rss.xml`.

---

## Architecture

```
bamidelealy.github.io/
├── index.html            ← root EN pages
├── projects.html
├── historian.html
├── studio.html
├── contact.html
├── about.html            ← legacy redirect → historian.html
├── 404.html              ← tri-lingual not-found, locale picked from URL
├── notes/
│   ├── index.html
│   ├── ile-owo-design.html
│   ├── ai-governance-as-road.html
│   └── bank-of-biafra-project.html
├── thanks/
│   └── index.html        ← noindex thank-you confirmation
├── fr/                   ← French locale tree, translated slugs
│   ├── index.html
│   ├── projets.html
│   ├── historienne.html
│   ├── atelier.html
│   ├── contact.html
│   ├── a-propos.html
│   ├── 404.html
│   ├── notes/{index,conception-ile-owo,gouvernance-ia-comme-route,projet-banque-biafra}.html
│   ├── merci/index.html
│   ├── rss.xml
│   └── search-data.json
├── de/                   ← German locale tree, translated slugs
│   ├── index.html
│   ├── projekte.html
│   ├── historikerin.html
│   ├── atelier.html
│   ├── kontakt.html
│   ├── ueber.html
│   ├── 404.html
│   ├── notizen/{index,ile-owo-konzept,ki-governance-als-strasse,projekt-bank-von-biafra}.html
│   ├── danke/index.html
│   ├── rss.xml
│   └── search-data.json
├── styles.css            ← design system (≈37 KB raw)
├── script.js             ← interactions (≈22 KB raw)
├── search-data.json      ← EN search index, 27 entries
├── assets/
│   ├── bamidele-aly-studio.{jpeg,webp,avif}
│   └── bamidele-studio.{jpeg,webp,avif}
├── sitemap.xml           ← 27 URLs with reciprocal xhtml:link hreflang
├── rss.xml               ← EN feed; FR + DE under their locale roots
├── robots.txt
├── llms.txt
├── ai.txt
├── CNAME                 ← bamidelealy.com
└── README.md
```

Zero build step. The browser parses HTML and renders. The CSS uses
native `@layer`, container-free `clamp()` typography, View Transitions
where supported, and a `<picture>` element on every raster so AVIF /
WebP win where the browser supports them.

---

## Design system

Apple-inspired token set, defined once in `:root` and
`:root[data-theme="dark"]`. Every colour, radius, motion value and
shadow flows from these tokens — change them once and the whole site
follows.

| Token group | Tokens |
|---|---|
| Surfaces | `--bg`, `--bg-soft`, `--surface`, `--surface-soft`, `--surface-elev` |
| Text | `--ink`, `--ink-soft`, `--ink-muted` |
| Accent | `--accent`, `--accent-hover`, `--accent-press`, `--accent-soft`, `--accent-ink` |
| Lines | `--line`, `--line-soft` |
| Motion | `--ease-out`, `--ease-in-out` |
| Layout | `--radius`, `--radius-pill`, `--container`, `--pad` |
| Typography | `--font-text` (Atkinson Hyperlegible), `--font-display` (SF Pro / system) |

Cascade order is pinned with
`@layer skeletonic.base, skeletonic.layout, skeletonic.elements, skeletonic.components, site;`
so the `site` layer always wins over the Skeletonic CDN baseline.

---

## Features

### Search

`Cmd+K` (macOS), `Ctrl+K` (Windows/Linux, shown as `Strg+K` on German
pages) or `/` opens a centred dialog. Substring + fuzzy-subsequence
match across 27 entries per locale. Arrow keys navigate, Enter
follows, Esc closes. Under 560 px the dialog becomes full-bleed and
the footer hints hide. The index is lazy-fetched on first open and
cached for the session.

The loader is locale-aware: pages with `<html lang="fr-…">` load
`/fr/search-data.json`, German pages load `/de/search-data.json`, all
others load `/search-data.json`. Empty-state and "no results" strings
are translated to match.

### Theme

OS-aware default via `prefers-color-scheme`, manual override stored in
`localStorage`. A four-line inline bootstrap script runs in `<head>`
before paint, so there is no flash of incorrect theme. Toggling the
theme dispatches a `themechange` custom event — the Mermaid diagram
listens and re-renders with the matching palette.

### Language selector

Every page (except redirect / 404 pages) carries an EN/FR/DE dropdown
in the header — a globe icon, the current locale code, and a chevron.
The dropdown items link directly to the equivalent page in each
locale (using the localised slug), so a visitor can switch languages
without losing context. The current locale is marked with
`aria-current="true"`. The dropdown closes on outside click and on
`Escape`.

### Architecture diagram

`projects.html` ships a MermaidJS flowchart of the Ile Owo eight-agent
system (Orchestrator, Filter, Summaryan, Historian, Insider, Outsider,
Auditor, Scribe). The 893 KB Mermaid bundle is **lazy-loaded** via
`IntersectionObserver` with a 400 px root-margin — pages that never
scroll to the diagram never pay for the library.

### Contact form

Posted to Formspree (`https://formspree.io/f/mvojvaej`) via `fetch()`.
On success the browser redirects to `/thanks/`. A hidden `_next` field
also handles the no-JS server-redirect path. If JS is enabled but
Formspree is unreachable, error states point at LinkedIn — never at a
plain-text email.

### Internationalisation

The site ships three full locale trees — English (canonical, `en-GB`),
French (`fr-FR` under `/fr/`) and German (`de-DE` under `/de/`). Each
HTML page declares its locale on `<html lang>`, carries reciprocal
`<link rel="alternate" hreflang>` for all four values
(`en-GB`, `fr-FR`, `de-DE`, `x-default`), and uses `og:locale` +
`og:locale:alternate` for OpenGraph.

Translated assets live alongside each tree:

- `fr/search-data.json`, `de/search-data.json` — 27 entries each,
  keyed by `index.fr` / `index.de`.
- `fr/rss.xml`, `de/rss.xml` — per-locale Atom feeds.
- `fr/404.html`, `de/404.html` — locale-specific error pages.

`sitemap.xml` lists every locale variant as its own `<url>` with
`<xhtml:link rel="alternate" hreflang>` entries for the other two
locales. JSON-LD `inLanguage` matches the page locale. Foreign-language
inline phrases are still tagged with `lang="yo"` (Yoruba) inside text
content so screen readers pronounce them correctly. JSON-LD
`Person.knowsLanguage` enumerates English, French, German, Yoruba,
Japanese and Dutch (localised in each tree).

---

## Engineering

### Performance

Live wire sizes (gzip) from the production response:

| Asset | Wire size |
|---|---|
| `styles.css` | 5.0 KB |
| `script.js` | 2.4 KB |
| `search-data.json` | 1.6 KB |
| Portrait WebP / AVIF | 8.8 KB / 15.6 KB |
| Studio AVIF | 40.7 KB |
| Mermaid bundle (lazy, only when visible) | 893 KB |

Headers:

- Hero image preloaded as WebP (`<link rel="preload" as="image">`).
- AVIF + WebP served via `<picture>` with JPG fallback.
- Google Fonts CSS preloaded with `as="style"`.
- `font-display: swap` so system fallback paints immediately.
- All `<script>` tags carry `defer`; Mermaid lazy-loaded on viewport
  intersection.
- `Cache-Control: max-age=2678400` on static assets (31 days).
- gzip + brotli at the edge.

### Accessibility

WCAG 2.2 conformance checklist:

- One `<h1>` per page, no heading-level skips.
- Every `<img>` has descriptive `alt`; every icon-only button has
  `aria-label`.
- Every form input has `<label for>`, `required`, and `aria-required`.
- Skip-link first in tab order; `<main>`, `<nav aria-label>`,
  `<footer>` landmarks on every page.
- Colour contrast: 7.29:1 (muted text) and 11:1 (body text) light; 8.88:1
  and 9.5:1 dark — AAA for body, AA for accent links.
- 36 px+ touch targets (WCAG 2.2 AA minimum is 24 px).
- `prefers-reduced-motion` disables animations, including the thanks
  page check-mark pop.
- Foreign-language spans tagged with `lang`.

### Security

Strict Content Security Policy via `<meta http-equiv>` on every page:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https:;
connect-src 'self' https://formspree.io;
base-uri 'self';
form-action 'self' https://formspree.io;
frame-ancestors 'none';
```

Plus at the HTTP layer (from the deploying CDN):
`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`.

Email obfuscation: no `mailto:` or plain-text address anywhere in
source. The contact form stores the address as base64 in
`data-mailto`, decoded only after a user-initiated reveal action.
JSON-LD uses a `ContactPoint` URL instead of an `email` field.

No analytics, no cookies, no trackers, no client-side storage beyond
`theme=` (only written if the user clicks the toggle).

### SEO and AI discovery

| File | Purpose |
|---|---|
| `sitemap.xml` | 27 URLs (9 pages × 3 locales) with reciprocal `xhtml:link rel="alternate" hreflang`, `lastmod`, `changefreq`, `priority`. |
| `rss.xml`, `fr/rss.xml`, `de/rss.xml` | Atom-style feed for each locale. |
| `robots.txt` | Explicit allow for `GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`. Lists all three locale feeds. |
| `llms.txt` | Canonical summary in all three languages, key facts, citation guidance. |
| `ai.txt` | Supplementary AI-crawler directives; advertises locale-specific entry points. |
| `<script type="application/ld+json">` | `@graph` of `Person`, `ProfilePage`, `WebSite`, `Event`, `Book`, `Chapter`, `SoftwareSourceCode`, `ContactPoint` — with `inLanguage` matching `<html lang>`. |

### Deployment

GitHub Pages from `main`. The repo must be named
`bamidelealy.github.io` (or the Pages source set to "Deploy from a
branch — main"). For a custom apex domain (`bamidelealy.com`):

1. A `CNAME` file containing `bamidelealy.com` already ships at the
   repo root, so the custom domain is tracked in git.
2. Configure DNS A records at the apex (or `ALIAS`/`ANAME` if your
   provider supports them):

   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

3. Enable **HTTPS** in repo Settings → Pages.

Canonicals, `og:url`, JSON-LD `@id` and `sitemap.xml` already point at
`https://bamidelealy.com/` so the SEO posture is correct from the
moment DNS resolves.

### Development

```bash
python3 -m http.server 8000   # default local dev path
```

No formatting tooling. HTML / CSS / JS are hand-authored to be
diff-friendly. Local audit recipes:

```bash
# Validate every JSON-LD block on every page (all locales)
python3 -c "
import re, json, pathlib
for p in pathlib.Path('.').rglob('*.html'):
  if '/.git/' in str(p): continue
  for m in re.finditer(r'<script type=\"application/ld\+json\">(.*?)</script>', p.read_text(), re.S):
    json.loads(m.group(1))
print('OK')
"

# Validate each locale's search index
python3 -c "
import json
for p in ['search-data.json','fr/search-data.json','de/search-data.json']:
  json.loads(open(p).read())
print('OK')
"

# Re-grade and re-encode the hero portrait (requires ImageMagick + libwebp + libavif)
magick assets/bamidele-aly-studio.jpeg \
  -modulate 102,116,100 -level 3%,97%,1.05 -unsharp 0x0.6+0.45+0 \
  -quality 92 assets/bamidele-aly-studio.jpeg
cwebp  -q 84 assets/bamidele-aly-studio.jpeg -o assets/bamidele-aly-studio.webp
avifenc --min 26 --max 34 --speed 4 assets/bamidele-aly-studio.jpeg assets/bamidele-aly-studio.avif
```

---

## License

MIT. The SPDX header at the top of this file is the canonical
declaration; this repository may also ship a `LICENSE` file alongside.

<p align="right"><a href="#contents">Back to Top</a></p>
