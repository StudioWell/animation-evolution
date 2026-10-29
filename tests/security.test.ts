import { test } from "node:test";
import assert from "node:assert/strict";
import { TtlCache } from "@/lib/security/cache";
import { buildContentSecurityPolicy } from "@/lib/security/headers";
import { MemoryRateLimitStore, RateLimiter } from "@/lib/security/rate-limit";
import { OutboundError, safeFetchJson } from "@/lib/security/safe-fetch";
import { cleanText, decodeEntities } from "@/lib/security/sanitize";
import { detectSource, isAllowedSourceUrl, isValidYouTubeId, parseSafeUrl, youtubeIdFromUrl } from "@/lib/security/url";

test("only https URLs on allowlisted hosts are accepted", () => {
  assert.ok(isAllowedSourceUrl("https://www.youtube.com/watch?v=uDqjIdI4bF4", "youtube"));
  assert.ok(isAllowedSourceUrl("https://create.roblox.com/docs/en-us/animation/editor", "roblox-creator-hub"));
  const bad = [
    "javascript:alert(1)",
    "data:text/html,hi",
    "http://www.youtube.com/watch?v=uDqjIdI4bF4",
    "https://user:pass@www.youtube.com/",
    "https://www.youtube.com.evil.example/watch",
    "https://evil.example/https://www.youtube.com",
    "https://127.0.0.1/",
    "https://[::1]/",
    "https://www.youtube.com:8443/",
    "https://www.youtube.com/watch?v=x\u0000",
    "https://www.youtube.com/watch?v=<script>",
  ];
  for (const url of bad) assert.equal(isAllowedSourceUrl(url, "youtube"), false, url);
  assert.equal(isAllowedSourceUrl("https://www.youtube.com/watch", "vimeo"), false);
});

test("URL parsing rejects non-strings and huge inputs", () => {
  assert.equal(parseSafeUrl(42).ok, false);
  assert.equal(parseSafeUrl(`https://www.youtube.com/${"a".repeat(3000)}`).ok, false);
  assert.equal(detectSource("https://github.com/x/y"), "github");
  assert.equal(detectSource("https://example.com"), null);
});

test("YouTube ids are validated before building URLs", () => {
  assert.ok(isValidYouTubeId("uDqjIdI4bF4"));
  assert.ok(isValidYouTubeId("-Gbl3CmXiBo"));
  assert.equal(isValidYouTubeId("short"), false);
  assert.equal(isValidYouTubeId("abc/../../xx"), false);
  assert.equal(youtubeIdFromUrl("https://youtu.be/uDqjIdI4bF4"), "uDqjIdI4bF4");
  assert.equal(youtubeIdFromUrl("https://www.youtube.com/watch?v=uDqjIdI4bF4&t=10"), "uDqjIdI4bF4");
  assert.equal(youtubeIdFromUrl("https://evil.example/watch?v=uDqjIdI4bF4"), null);
});

test("metadata is normalised to plain text", () => {
  assert.equal(decodeEntities("Rock &amp; Roll &#39;n&#x27; roll"), "Rock & Roll 'n' roll");
  assert.equal(cleanText("a‮evil\u0000  b"), "aevil b");
  assert.equal(cleanText("x".repeat(400), 10).length, 10);
  assert.equal(cleanText(undefined), "");
});

test("rate limiter allows a burst, then refills over time", () => {
  let now = 0;
  const limiter = new RateLimiter(new MemoryRateLimitStore(), () => now);
  const policy = { capacity: 3, perMinute: 60 };
  assert.ok(limiter.check("a", policy).allowed);
  assert.ok(limiter.check("a", policy).allowed);
  assert.ok(limiter.check("a", policy).allowed);
  const blocked = limiter.check("a", policy);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter >= 1);
  assert.ok(limiter.check("b", policy).allowed, "separate clients have separate buckets");
  now += 1000;
  assert.ok(limiter.check("a", policy).allowed, "one token refills per second at 60/min");
});

test("TTL cache expires entries and evicts least-recently-used", () => {
  let now = 0;
  const cache = new TtlCache<number>(2, 1000, () => now);
  cache.set("a", 1);
  cache.set("b", 2);
  cache.get("a");
  cache.set("c", 3);
  assert.equal(cache.get("b"), undefined, "b was least recently used");
  assert.equal(cache.get("a"), 1);
  now += 1001;
  assert.equal(cache.get("a"), undefined, "expired");
});

test("safe fetch refuses hosts outside the outbound allowlist", async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return new Response("{}");
  }) as typeof fetch;
  for (const url of ["https://evil.example/x", "http://www.googleapis.com/x", "https://169.254.169.254/latest", "file:///etc/passwd"]) {
    await assert.rejects(safeFetchJson(url, { fetchImpl }), (e: unknown) => e instanceof OutboundError && e.kind === "blocked");
  }
  assert.equal(called, false);
});

test("safe fetch enforces JSON and a size cap", async () => {
  const big = (async () =>
    new Response(JSON.stringify({ x: "y".repeat(5000) }), { headers: { "content-type": "application/json" } })) as typeof fetch;
  await assert.rejects(safeFetchJson("https://www.googleapis.com/youtube/v3/videos", { fetchImpl: big, maxBytes: 1000 }), /too large/);
  const html = (async () => new Response("<html>", { headers: { "content-type": "text/html" } })) as typeof fetch;
  await assert.rejects(safeFetchJson("https://www.googleapis.com/youtube/v3/videos", { fetchImpl: html }), /content type/);
});

test("CSP blocks framing, plugins and foreign scripts", () => {
  const csp = buildContentSecurityPolicy(false);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  // The only foreign scripts are Google's sign-in client and Firebase's SDK (My Profile, community videos).
  assert.match(csp, /script-src 'self' 'unsafe-inline' https:\/\/accounts\.google\.com\/gsi\/client https:\/\/www\.gstatic\.com\/firebasejs\/ https:\/\/apis\.google\.com(;|$)/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.match(csp, /img-src 'self' data: blob: https:\/\/i\.ytimg\.com/);
});
