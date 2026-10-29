# Security

## Threat model

Animation Evolution is a read-only public site. It has no accounts, no user uploads and no database. The realistic risks are:

1. **Volumetric abuse / DDoS** — handled at the edge (see [DEPLOYMENT.md](DEPLOYMENT.md)); the app adds rate limits, caching and load shedding.
2. **API-quota exhaustion** — someone driving live YouTube searches to burn the daily quota.
3. **Malicious or malformed third-party metadata** — titles/descriptions from YouTube rendered as markup.
4. **Unsafe outbound links** — a bad URL in the data (`javascript:`, look-alike hosts).
5. **SSRF** — the server being tricked into fetching arbitrary URLs.
6. **Secret leakage** — the API key ending up in client bundles or logs.

## Controls

| Requirement | Implementation |
| --- | --- |
| Server-side input validation | `lib/search/params.ts` — Zod schema, strict mode for the API (unknown values → 400), length caps, control-character stripping. URL length capped at 2 KB in `lib/security/api.ts`. |
| Output encoding / XSS | React escapes all text. Third-party metadata is normalised to plain text (`lib/security/sanitize.ts`). `dangerouslySetInnerHTML` is banned by ESLint (`react/no-danger`); the single exception is the static, first-party settings script in `app/layout.tsx`. |
| SQL injection | Not applicable — there is no database. If you add Postgres, use parameterised queries only (`pg` with `$1` placeholders, or an ORM such as Drizzle/Prisma) and never build SQL with string concatenation. |
| CSRF | The API is GET-only and changes no state, and there are no session cookies. If you add accounts: `SameSite=Lax` (or `Strict`) `HttpOnly` `Secure` cookies plus a CSRF token or Origin check on every state-changing request. |
| Secure HTTP headers | `lib/security/headers.ts` via `next.config.ts`: CSP, HSTS (2 years, preload), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP. `X-Powered-By` disabled. |
| Strict CORS | No `Access-Control-Allow-Origin` header is ever sent. Browser requests with `Sec-Fetch-Site: cross-site` are refused (403) unless the origin is in `ALLOWED_ORIGINS`. |
| Authentication / authorization | Not applicable — no accounts. See "If you add accounts" below. |
| Secret management | Secrets live only in environment variables without `NEXT_PUBLIC_`. Modules that read them import `server-only`, so a build fails if client code imports them. `.env*` is git-ignored except `.env.example`. |
| API key protection | The YouTube key is only used server-side in `lib/sources/youtube.ts`, never logged or returned. Restrict the key in Google Cloud to the YouTube Data API v3 (and to your server IP if static). |
| Request timeouts and concurrency limits | 10 s per API request (`lib/security/api.ts`), 6 s per upstream call, at most 4 concurrent upstream calls with a queue of 16; beyond that requests are shed with 503 (`lib/security/concurrency.ts`). |
| Safe error handling | API errors return `{ error: { code, message } }` with no stack traces; details go to the server log. Route errors show a generic page with a reference digest. |
| Logging and monitoring | Structured JSON events (`lib/security/log.ts`), IPs stored only as salted hashes. Event list and alerting advice in DEPLOYMENT.md. |
| URL validation / allowlist | `lib/security/url.ts` + `lib/config/sources.ts`: https only, standard port, no credentials, no IP-literal hosts, no control characters, host must be on the source's allowlist. Checked when records load (invalid records are dropped and fail tests) and again when a link renders (`ExternalLink`). YouTube URLs are built from validated 11-character ids, never from raw strings. |
| SSRF prevention | All outbound requests go through `lib/security/safe-fetch.ts`: https to `www.googleapis.com` only, redirects refused, timeout, 1 MB response cap, JSON content type required. The image optimizer only fetches from `i.ytimg.com/vi/**` (`next.config.ts` `remotePatterns`), so it can't be used as an open proxy. |
| Rate limits on search | Per-client token buckets plus a per-instance global bucket (`lib/security/rate-limit.ts`): library search 60/min (burst 30), live search 10/min (burst 5). |
| Caching of external responses | Live searches cached 30 min, video metadata 6 h, with in-flight request coalescing (`lib/security/cache.ts`). Search responses carry `s-maxage` so the CDN can serve repeats. |
| API quotas | A local daily budget (`YOUTUBE_DAILY_QUOTA_BUDGET`) stops calls before Google's quota runs out; quota errors degrade to "live search unavailable" without affecting the curated library. |
| Unavailable / unsafe videos | Live search uses `safeSearch=strict`. Private, deleted and unprocessed videos are marked unavailable and hidden; age-restricted videos are excluded from live results. Curated videos the API reports as missing are hidden from listings and their details page explains why. |

### What the in-app rate limiter is not

It's per instance and in memory. It stops casual abuse and protects the YouTube quota, but it can't stop a distributed attack — by the time it runs, the request has already reached your server. Edge protection is required. For multi-instance deployments, implement `RateLimitStore` (`lib/security/rate-limit.ts`) on Redis or Upstash so limits are shared.

## Content Security Policy

The default CSP allows `'unsafe-inline'` for scripts because Next.js emits inline bootstrap scripts for static rendering, and the site uses one inline script to apply settings before first paint. Nothing renders third-party HTML, so this doesn't open an injection path today.

For a stricter policy, switch to nonces: generate a nonce per request in `proxy.ts` (Next.js 16's replacement for `middleware.ts`), set it in a `Content-Security-Policy` header with `'nonce-…' 'strict-dynamic'`, read it in `app/layout.tsx` via `headers()` and pass it to the inline script. This makes every page dynamically rendered; follow the Next.js "Content Security Policy" guide for the exact current API.

## If you add accounts, submissions or a database

- **Auth:** use a maintained library (Auth.js, Clerk, Lucia-style patterns) rather than custom session code; store sessions server-side or in signed, `HttpOnly`, `Secure`, `SameSite` cookies; rate-limit login.
- **Authorization:** check permissions on the server for every mutation, not in the UI.
- **Submissions:** never publish user-submitted links directly. Put them in a `pending` queue, run `parseSafeUrl` + source allowlist + `detectSource`, fetch metadata only through the official API (never fetch the submitted URL itself), and require a moderator to approve. Record who approved what and when.
- **Database:** PostgreSQL with parameterised queries, least-privilege credentials, TLS to the database, backups.

## Reporting a vulnerability

Email the maintainer privately rather than opening a public issue. Include steps to reproduce and the affected URL.
