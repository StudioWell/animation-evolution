import { test } from "node:test";
import assert from "node:assert/strict";
import { availabilityOf, mapVideo, youtubeAdapter } from "@/lib/sources/youtube";

const video = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  snippet: {
    title: "How to Animate a Punch &amp; Kick",
    description: "Learn it here https://example.com #animation",
    channelTitle: "Test Channel",
    publishedAt: "2024-03-30T12:00:00Z",
    tags: ["Punch", "Blender"],
  },
  contentDetails: { duration: "PT12M48S" },
  statistics: { viewCount: "12345" },
  status: { privacyStatus: "public", uploadStatus: "processed" },
  ...extra,
});

test("maps API videos to resources with real metadata only", () => {
  const r = mapVideo(video("uDqjIdI4bF4"), "tutorial")!;
  assert.equal(r.title, "How to Animate a Punch & Kick");
  assert.equal(r.creator, "Test Channel");
  assert.equal(r.durationSeconds, 768);
  assert.equal(r.viewCount, 12345);
  assert.equal(r.publishedAt, "2024-03-30");
  assert.equal(r.url, "https://www.youtube.com/watch?v=uDqjIdI4bF4");
  assert.equal(r.origin, "live");
  assert.ok(r.software?.includes("blender"));
  assert.ok(!r.description.includes("https://"));
});

test("missing duration stays null rather than being guessed", () => {
  const r = mapVideo(video("uDqjIdI4bF4", { contentDetails: {} }), "reference")!;
  assert.equal(r.durationSeconds, null);
});

test("rejects malformed ids and flags unavailable or age-restricted videos", () => {
  assert.equal(mapVideo(video("../../etc"), "reference"), null);
  assert.equal(availabilityOf(video("uDqjIdI4bF4", { status: { privacyStatus: "private" } })), "unavailable");
  assert.equal(
    availabilityOf(video("uDqjIdI4bF4", { contentDetails: { duration: "PT1M", contentRating: { ytRating: "ytAgeRestricted" } } })),
    "restricted",
  );
});

test("live search: not configured without a key", async () => {
  delete process.env.YOUTUBE_API_KEY;
  const page = await youtubeAdapter.search({ kind: "tutorial", q: "rig", duration: "any", sort: "relevance", pageToken: null });
  assert.equal(page.enabled, false);
  assert.equal(page.error, "not-configured");
});

test("live search: calls the API, filters restricted results and caches", async () => {
  process.env.YOUTUBE_API_KEY = "test-key";
  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: URL | RequestInfo) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    assert.equal(url.hostname, "www.googleapis.com");
    assert.equal(url.searchParams.get("key"), "test-key");
    const body = url.pathname.endsWith("/search")
      ? { items: [{ id: { videoId: "uDqjIdI4bF4" } }, { id: { videoId: "JITg4ci8Ook" } }], nextPageToken: "CAoQAA" }
      : {
          items: [
            video("uDqjIdI4bF4"),
            video("JITg4ci8Ook", { contentDetails: { duration: "PT5M", contentRating: { ytRating: "ytAgeRestricted" } } }),
          ],
        };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const input = { kind: "tutorial" as const, q: "punch unique-query", duration: "any" as const, sort: "relevance" as const, pageToken: null };
    const page = await youtubeAdapter.search(input);
    assert.equal(page.error, null);
    assert.deepEqual(page.items.map((i) => i.youtubeId), ["uDqjIdI4bF4"], "age-restricted result removed");
    assert.equal(page.nextPageToken, "CAoQAA");
    const before = calls.length;
    await youtubeAdapter.search(input);
    assert.equal(calls.length, before, "second identical search is served from cache");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("live search: upstream 403 is reported as quota, not thrown", async () => {
  process.env.YOUTUBE_API_KEY = "test-key";
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("{}", { status: 403, headers: { "content-type": "application/json" } })) as typeof fetch;
  try {
    const page = await youtubeAdapter.search({ kind: "reference", q: "quota test", duration: "any", sort: "relevance", pageToken: null });
    assert.equal(page.error, "quota");
    assert.deepEqual(page.items, []);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.YOUTUBE_API_KEY;
  }
});
