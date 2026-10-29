# Deployment

DDoS protection cannot be provided by application code. It has to be absorbed by an edge network before traffic reaches the app. This guide covers two supported setups and a checklist to confirm protection is actually working. **Don't describe the site as protected until the checklist passes.**

Plan features below were checked against provider documentation in October 2026. Providers change plans; confirm against the linked docs before relying on a specific limit.

---

## Option 0 — GitHub Pages (static, no server)

For when only a GitHub account is available. The `docs/` folder holds a static build of the same app (`npm run build:static`) that runs entirely in the browser.

1. Push the repository to GitHub (public — required for Pages on free accounts).
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/docs`, **Save**.
3. Wait for the "pages build and deployment" run under **Actions** to finish; the site is at `https://<username>.github.io/<repository>/`.

What changes compared with the server version:

- No live YouTube search, durations or view counts: those need the API key, and a static site can't keep a key secret, so the static build never includes one.
- No API to attack: search runs in each visitor's browser over the bundled library. GitHub serves the files; there is no server of yours to overload, and rate limiting doesn't apply.
- GitHub Pages can't set HTTP headers, so the build ships a `<meta>` Content-Security-Policy (scripts limited to the site's own `app.js` plus one inline script pinned by hash, images to `i.ytimg.com`, no plugins). `frame-ancestors` and HSTS can't be set this way; put Cloudflare in front of a custom domain if you need them.
- GitHub documents usage limits for Pages (including a soft monthly bandwidth limit); check GitHub's current Pages limits if the site gets heavy traffic, and move to Option A or B when it outgrows them.

---

## Option A — Vercel (simplest)

1. Push the repository to GitHub/GitLab and import it in Vercel. Framework preset: Next.js. No build settings needed.
2. **Settings → Environment Variables** (Production and Preview):
   - `YOUTUBE_API_KEY` (optional), `YOUTUBE_DAILY_QUOTA_BUDGET=8000`
   - `TRUSTED_IP_HEADER=x-forwarded-for`
   - `LOG_SALT` = output of `openssl rand -hex 32`
3. Add your domain; Vercel provisions HTTPS automatically.

**What Vercel provides** ([DDoS mitigation](https://vercel.com/docs/vercel-firewall/ddos-mitigation), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)):

- Automatic L3/L4/L7 DDoS mitigation on all plans; blocked traffic isn't billed.
- **Attack Mode** (all plans) — challenges every visitor; switch it on during an attack.
- WAF custom rules and WAF rate limiting (Hobby: 1 rate-limit rule per project; Pro: 40).

**Configure in Firewall → Configure:**

| Rule | Condition | Action |
| --- | --- | --- |
| Rate limit API | Path starts with `/api/` | Rate limit: 60 requests / 60 s per IP → 429 |
| Rate limit live search (Pro) | Path equals `/api/live` | Rate limit: 10 requests / 60 s per IP → 429 |
| Block non-GET API calls | Path starts with `/api/` and method is not `GET` | Deny |

Start each rule with the **Log** action, check the Firewall overview for false positives, then switch to the blocking action.

**Spend controls (Pro):** set a Spend Management limit with a notification so an attack that slips past mitigation can't run up costs.

> Putting Cloudflare in front of Vercel is possible but changes how Vercel's firewall and cache see traffic. Read Vercel's guide on [reverse proxies](https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment) first. If you do it, set `TRUSTED_IP_HEADER=cf-connecting-ip`.

---

## Option B — Self-hosted (Docker) behind Cloudflare

### 1. Build and run the container

The included `Dockerfile` builds a standalone Next.js server that runs as a non-root user.

```bash
docker build -t animation-evolution .
docker run -d --name ae --restart unless-stopped -p 127.0.0.1:3000:3000 \
  -e YOUTUBE_API_KEY=... -e TRUSTED_IP_HEADER=cf-connecting-ip -e LOG_SALT=... \
  --read-only --tmpfs /tmp --memory 512m --cpus 1 \
  animation-evolution
```

Binding to `127.0.0.1` keeps the container private; a reverse proxy (or Cloudflare Tunnel) publishes it.

### 2. Reverse proxy limits (nginx example)

```nginx
limit_req_zone $http_cf_connecting_ip zone=api:10m rate=1r/s;

server {
  listen 443 ssl http2;
  server_name animation-evolution.example;
  # Cloudflare Origin CA certificate + Authenticated Origin Pulls are recommended.

  client_max_body_size 16k;          # the app only accepts GET requests
  client_body_timeout 10s;
  client_header_timeout 10s;
  keepalive_timeout 15s;
  send_timeout 15s;

  location /api/ {
    limit_except GET { deny all; }
    limit_req zone=api burst=30 nodelay;
    proxy_read_timeout 12s;
    proxy_pass http://127.0.0.1:3000;
  }
  location / {
    proxy_read_timeout 30s;
    proxy_pass http://127.0.0.1:3000;
  }
}
```

### 3. Lock the origin to Cloudflare

Attackers who find the origin IP can bypass Cloudflare entirely. Do one of:

- **Cloudflare Tunnel** (`cloudflared`) — no inbound ports open at all (recommended), or
- a firewall that only accepts 443 from [Cloudflare's IP ranges](https://www.cloudflare.com/ips/), plus **Authenticated Origin Pulls**.

### 4. Cloudflare settings

**DNS:** the record must be **Proxied** (orange cloud). **SSL/TLS:** Full (strict). Enable **Always Use HTTPS** and **HSTS**.

**DDoS:** Cloudflare's [HTTP DDoS Attack Protection managed ruleset](https://developers.cloudflare.com/ddos-protection/managed-rulesets/http/) is always on for every plan, including Free, once the zone is proxied. Keep the default sensitivity unless you see false positives.

**WAF managed rules** ([docs](https://developers.cloudflare.com/waf/managed-rules/)): Free plans get the Cloudflare Free Managed Ruleset. Pro and above can also enable the Cloudflare Managed Ruleset and the OWASP Core Ruleset — turn both on.

**WAF custom rules** (Security → WAF → Custom rules):

| Name | Expression | Action |
| --- | --- | --- |
| API is GET-only | `starts_with(http.request.uri.path, "/api/") and http.request.method ne "GET"` | Block |
| Oversized query strings | `len(http.request.uri.query) gt 2048` | Block |

**Rate limiting rules** ([plan limits](https://developers.cloudflare.com/learning-paths/application-security/rate-limiting/features/)) — counted per IP:

| Plan | Rules | Suggested configuration |
| --- | --- | --- |
| Free | 1 rule, 10 s period | `starts_with(http.request.uri.path, "/api/")` — 20 requests / 10 s → Block for 10 s |
| Pro | 2 rules, periods up to 1 min | Rule 1 as above (60 / 1 min). Rule 2: `http.request.uri.path eq "/api/live"` — 10 / 1 min → Block for 10 min |
| Business | 5 rules, up to 10 min | Add a site-wide rule for page requests (e.g. 600 / 1 min) |

**Bots:** Security → Bots → enable **Bot Fight Mode** (Free) or **Super Bot Fight Mode** (Pro+), challenging "definitely automated" traffic. Watch for false positives on `/api/` from legitimate monitors.

**Caching** (Caching → Cache Rules):

- `/_next/static/*` — eligible for cache; respect origin headers (Next.js marks these immutable).
- `/_next/image*` — eligible for cache, edge TTL 1 day.
- `/api/references/search*`, `/api/tutorials/search*` — eligible for cache, respect origin (the app sends `s-maxage=60`).
- `/api/live*` — respect origin (`s-maxage=600` on success, `no-store` on errors).

Cached responses never reach the app, which is the most effective way to absorb repeated identical requests.

**Notifications:** Notifications → add *HTTP DDoS Attack Alert* and *Security Events Alert* (availability depends on plan).

---

## Monitoring

The app writes one JSON line per security-relevant event to stdout/stderr:

| `event` | Meaning |
| --- | --- |
| `rate_limited` | A client or the instance hit the app-level rate limit |
| `cross_site_blocked` | A cross-site browser request to the API was refused |
| `invalid_request` | Input failed validation (400) |
| `overloaded` | Upstream pool full; request shed with 503 |
| `upstream_error` / `upstream_timeout` | YouTube API failure |
| `quota_exhausted` | Local YouTube quota budget reached |
| `unhandled_error` | Unexpected server error (no stack trace is sent to clients) |

Ship logs to your provider's log drain (Vercel Log Drains, Cloudflare Logpush, Docker logging driver) and alert on bursts of `rate_limited`, any `unhandled_error`, and `quota_exhausted`. Add an external uptime check for `/` and `/api/references/search?q=walk`.

---

## Verification checklist

Run these against the production domain before calling the deployment protected.

- [ ] `curl -sI https://YOUR_DOMAIN/ | grep -iE "server|cf-ray|x-vercel-id"` shows the edge provider is serving the site.
- [ ] Origin is unreachable directly (self-hosted): connecting to the origin IP on 443 times out or is refused.
- [ ] Security headers present: `curl -sI https://YOUR_DOMAIN/ | grep -iE "content-security-policy|strict-transport|x-frame-options|x-content-type-options|referrer-policy|permissions-policy"`.
- [ ] Edge rate limit fires: `for i in $(seq 1 80); do curl -s -o /dev/null -w "%{http_code} " "https://YOUR_DOMAIN/api/references/search?q=t$i"; done` ends in 429s, and the event appears in the provider's security log.
- [ ] Non-GET API requests are blocked: `curl -s -o /dev/null -w "%{http_code}" -X POST https://YOUR_DOMAIN/api/references/search` → 403/405.
- [ ] Cross-site API calls are refused: `curl -s -o /dev/null -w "%{http_code}" -H "sec-fetch-site: cross-site" -H "origin: https://example.com" "https://YOUR_DOMAIN/api/references/search?q=a"` → 403.
- [ ] Cache works: repeat a search request and check `cf-cache-status: HIT` or `x-vercel-cache: HIT`.
- [ ] Secrets don't reach the browser: search the built assets — `grep -r "AIza" .next/static` returns nothing.
- [ ] Alerts are configured and a test notification was received.
