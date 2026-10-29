# Animation Evolution

Animation Evolution gathers references and animation lessons in one place — less time spent searching, more time on animation.

A searchable library of animation references and video tutorials for animators, 3D artists and game developers. Find the walk, hit, fall or rigging lesson you need, filter it by category, type, tool, level and length, and open it on its original platform.

- **Reference Library** — movement footage, slow-motion studies, film and game-animation breakdowns, mocap data. Each reference has a details page with related references and tutorials.
- **Tutorial Library** — its own search and filters (level, software, topic, length, source). Cards open the original tutorial in a new tab; a Details link stays on the site.
- **Curated, verified data** — every title, creator, date and URL was copied from the source page. Nothing is downloaded or rehosted.
- **Optional live YouTube search** — through the official YouTube Data API, server-side only, clearly labelled and kept separate from the curated list.
- **Settings** — three themes (Dark, Light, Dark Brown), Show Video Timestamps, Reduce Animations, Reset; saved in the browser with cookie and in-memory fallbacks.
- **Security** — validated input, allowlisted links, SSRF-safe outbound requests, rate limits, strict headers, and a documented edge setup for DDoS protection.

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local     # optional: add YOUTUBE_API_KEY
npm run dev                    # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Commit the generated `package-lock.json` so builds are reproducible.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript, strict mode |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Unit and API tests (Node test runner via `tsx`) |
| `npm run verify:data` | Validates every curated record; with `YOUTUBE_API_KEY` also checks every curated video is still available |
| `npm run check` | All of the above |
| `npm run build:static` | Rebuilds the GitHub Pages version into `docs/` |

## Configuration

All variables are optional and server-only (except the public Google client id) — see [`.env.example`](.env.example) for descriptions.

| Variable | Purpose |
| --- | --- |
| `YOUTUBE_API_KEY` | Enables live YouTube search and refreshes curated videos' duration, views, date and availability |
| `YOUTUBE_DAILY_QUOTA_BUDGET` | Local daily cap on API units (default 8000 of YouTube's default 10,000) |
| `YOUTUBE_RELEVANCE_LANGUAGE` | Language hint for live results |
| `TRUSTED_IP_HEADER` | Header carrying the real client IP for rate limiting (`x-forwarded-for` on Vercel, `cf-connecting-ip` behind Cloudflare) |
| `LOG_SALT` | Salt for hashing client IPs in logs |
| `ALLOWED_ORIGINS` | Extra origins allowed to call the API cross-site (normally empty) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Turns on "Continue with Google" on My Profile (a public OAuth client id, not a secret) |

### Getting a YouTube Data API key

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project.
2. **APIs & Services → Library** → enable **YouTube Data API v3**.
3. **Credentials → Create credentials → API key**.
4. Edit the key → **API restrictions** → restrict to YouTube Data API v3.
5. Put it in `YOUTUBE_API_KEY` (in `.env.local`, or your host's environment settings). Never prefix it with `NEXT_PUBLIC_`.

Without a key, the site runs entirely on the curated library. With one, durations appear on cards (they're never estimated), "Most popular" sorts by real view counts, deleted/private videos are hidden automatically, and each library offers "Search YouTube for …".

### Turning on Google sign-in (My Profile)

1. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → OAuth consent screen**: set it up (External, app name, support email). Only the basic profile is used.
2. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
3. Under **Authorized JavaScript origins**, add your site's address (e.g. `https://yourname.github.io` or your Vercel domain, plus `http://localhost:3000` for development).
4. Copy the client id (`…apps.googleusercontent.com`) into `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. For the static GitHub Pages build, set it when building: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=… npm run build:static`.

Profiles (name, photo, saved videos) are kept in the visitor's browser and keyed to their Google account; nothing is sent to a server. Without a client id, My Profile offers a profile stored on this device instead.

## How it's built

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Zod.

```
app/                    Routes: home, references, tutorials, [id] details, categories, settings, about
  api/references/search   GET — curated reference search
  api/tutorials/search    GET — curated tutorial search
  api/live                GET — opt-in live YouTube search
components/
  home/                 Onion-skin title, search, carousels, category grid
  library/              Explorer (search + filters + pagination), facet navigation, results, live results
  resources/            Reference and tutorial cards, thumbnail, details layout, external links
  layout/               Header, menu (dropdown on desktop, drawer on phones), footer
  settings/             Settings store/provider and the settings page
  ui/                   Icons, search field, accessible dropdown
lib/
  config/               Categories, sources (link allowlist), filter labels — no UI code
  data/                 Curated records + validation
  search/               Text normalisation, ranking engine, param validation, API handlers
  sources/              Source-adapter interface, YouTube adapter, library hydration
  security/             URL validation, sanitising, rate limiting, caching, safe fetch, headers, logging
  settings/             Settings schema, storage with fallbacks, pre-paint script
tests/                  Search, params, security, YouTube adapter, data, settings, API handler tests
scripts/verify-data.ts  Library health check
guides/                 SECURITY.md, DEPLOYMENT.md, CONTENT.md
scripts/build-static.mjs  Static build for GitHub Pages → docs/
docs/                   Built static site served by GitHub Pages (generated — don't edit by hand)
```

**Search.** `lib/search/engine.ts` is a pure, field-weighted ranker (title › tags/categories › creator › description) with light stemming, an animation-specific synonym map and prefix matching for as-you-type search. Categories combine with OR, every other filter with AND. The same engine serves server-rendered first pages and the JSON API. For a much larger catalogue, swap the engine for Postgres full-text search behind the same function signature.

**Source adapters.** A live source implements `LiveSearchAdapter` (`lib/sources/types.ts`) and is registered in `lib/sources/registry.ts`. The API routes and UI don't change when a platform is added.

**Settings.** Settings are mirrored onto `<html data-theme data-timestamps data-motion>`; CSS reads those attributes, so a change updates the whole site instantly without re-rendering. A tiny inline script applies saved settings before first paint.

**Themes.** Every colour is a token in `app/globals.css` (`--ae-bg`, `--ae-surface`, `--ae-accent`, …). A theme is one block of values; Tailwind utilities like `bg-surface` and `text-muted` map to the tokens.

## Content

The library ships with 38 records (21 references, 17 tutorials). 29 were checked against the source page itself (title, creator, date). 9 YouTube references were confirmed from YouTube's own listing (title and link) but their pages couldn't be read to confirm the channel and date, so those fields are left empty and shown as "Channel not confirmed" until the API fills them in. See [guides/CONTENT.md](guides/CONTENT.md) to add resources, categories or sources.

Difficulty levels are this library's editorial rating, not the creator's.

## Community videos (Google sign-in + Firebase)

Visitors sign in with Google, then publish their own reference or tutorial from **My Profile**: a YouTube/Vimeo link (or a video file, see below), category, platform and up to three genres. A new video is visible only to its author until the site owner approves it in the review window (shield button in the header, shown only to the owner's Google account). A rejection carries a reason, which the author sees as a notification.

The static site has no server, so accounts and submissions live in a Firebase project:

1. [Firebase console](https://console.firebase.google.com) → create a project.
2. **Authentication → Sign-in method → Google → Enable.** Under **Settings → Authorized domains** add the site's domain (e.g. `yourname.github.io`).
3. **Firestore Database → Create database** (production mode).
4. **Firestore → Rules:** paste [`firebase/firestore.rules`](firebase/firestore.rules) with `OWNER_EMAIL` replaced by the owner's Google email → **Publish**. These rules are what stop anyone else from approving or publishing.
5. **Project settings → Your apps → Web app** → copy the `firebaseConfig` values into `FIREBASE_CONFIG` in [`lib/firebase/config.ts`](lib/firebase/config.ts). The web config is public by design.
6. Set `OWNER_EMAIL_SHA256` in the same file to the SHA-256 of the owner's email, lower-case (`printf '%s' you@gmail.com | sha256sum`). It only decides who sees the review button.
7. `npm run build:static` and commit `docs/`.

**Video files** need Cloud Storage for Firebase, which requires the Blaze plan. Enable Storage, paste [`firebase/storage.rules`](firebase/storage.rules) (with `OWNER_EMAIL`), and set `FIREBASE_UPLOADS = true`. Without it, people submit links.

When the site runs as a claude.ai artifact it uses that runtime instead (claude.ai accounts, the artifact's database and file store), so the same feature works there without Firebase.

## Two ways to run it

| | Full version (Next.js server) | Static version (GitHub Pages) |
| --- | --- | --- |
| Hosting | Vercel, or Docker behind Cloudflare | GitHub Pages — only a GitHub account needed |
| Search, filters, categories, details, themes, settings | Yes | Yes |
| Live YouTube search, real durations and view counts | Yes, with `YOUTUBE_API_KEY` | No — needs a server to keep the key secret |
| Page addresses | `/references?q=walk` | `#/references?q=walk` |

**Publish the static version:** repository **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/docs` → Save**. The site appears at `https://<username>.github.io/<repository>/`. After changing code or content, run `npm run build:static` and commit the updated `docs/` folder. GitHub Pages on a free account requires a public repository.

## Deployment and security

- [guides/DEPLOYMENT.md](guides/DEPLOYMENT.md) — GitHub Pages, Vercel, or self-hosted (Docker) behind Cloudflare, with WAF, rate-limit, bot and cache rules, and a checklist to verify protection before you rely on it.
- [guides/SECURITY.md](guides/SECURITY.md) — threat model, the control for each requirement, and what to add if you introduce accounts or a database.

DDoS protection comes from the edge provider, not from application code. The app adds rate limiting, load shedding and caching on top, but those only help once traffic reaches it.

## Accessibility

Semantic landmarks, skip link, visible focus rings, keyboard-operable menu (focus trap, Escape, arrow keys) and listbox dropdowns, `aria-pressed` filter chips, live regions for result counts and toasts, reduced-motion support (OS preference and the in-app setting), and colour tokens chosen for readable contrast in all three themes.
