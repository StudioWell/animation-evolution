import { test } from "node:test";
import assert from "node:assert/strict";
import { librarySearchHandler, liveSearchHandler } from "@/lib/search/handlers";

const GET = librarySearchHandler("reference");
const req = (qs: string, headers: Record<string, string> = {}) =>
  new Request(`http://localhost/api/references/search?${qs}`, { headers: { "x-forwarded-for": "203.0.113.7", ...headers } });

test("returns a JSON page with cache headers", async () => {
  const res = await GET(req("q=punch"));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);
  assert.match(res.headers.get("cache-control") ?? "", /s-maxage=60/);
  const body = await res.json();
  assert.ok(body.total > 0);
  assert.equal(body.live.enabled, false);
});

test("rejects invalid input with 400 and no stack trace", async () => {
  const res = await GET(req("sort=%3Cscript%3E"));
  assert.equal(res.status, 400);
  const text = await res.text();
  assert.doesNotMatch(text, /at .*\.ts:\d+/);
  assert.match(text, /invalid_query/);
});

test("refuses cross-site browser requests (strict CORS)", async () => {
  const res = await GET(req("q=walk", { "sec-fetch-site": "cross-site", origin: "https://evil.example" }));
  assert.equal(res.status, 403);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("rate limits a single client with Retry-After", async () => {
  let limited: Response | null = null;
  for (let i = 0; i < 60 && !limited; i++) {
    const res = await GET(req(`q=x${i}`, { "x-forwarded-for": "198.51.100.9" }));
    if (res.status === 429) limited = res;
  }
  assert.ok(limited, "expected a 429");
  assert.ok(Number(limited!.headers.get("retry-after")) >= 1);
  const other = await GET(req("q=walk", { "x-forwarded-for": "192.0.2.44" }));
  assert.equal(other.status, 200, "other clients are unaffected");
});

test("live search requires a kind and a query", async () => {
  const bad = await liveSearchHandler(new Request("http://localhost/api/live?kind=nope&q=x"));
  assert.equal(bad.status, 400);
  const empty = await liveSearchHandler(new Request("http://localhost/api/live?kind=tutorial"));
  assert.equal(empty.status, 400);
  const off = await liveSearchHandler(new Request("http://localhost/api/live?kind=tutorial&q=rig"));
  assert.equal(off.status, 200);
  assert.equal((await off.json()).error, "not-configured");
});
