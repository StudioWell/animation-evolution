import { test } from "node:test";
import assert from "node:assert/strict";
import { CURATED_LIBRARY } from "@/lib/data";
import { durationBucketMatches, relatedResources, searchResources } from "@/lib/search/engine";
import { parseSearchQuery } from "@/lib/search/params";
import { defaultQuery, toSearchParams } from "@/lib/search/query-string";
import type { Resource, SearchQuery } from "@/lib/types";

const q = (kind: "reference" | "tutorial" | "all", patch: Partial<SearchQuery> = {}) => ({ ...defaultQuery(kind), ...patch });
const titles = (items: Resource[]) => items.map((i) => i.title.toLowerCase());

test("example searches from the brief return relevant references", () => {
  const punch = searchResources(CURATED_LIBRARY, q("reference", { q: "Heavy punch impact" }));
  assert.ok(punch.total > 0);
  assert.match(titles(punch.items)[0]!, /punch/);

  const walk = searchResources(CURATED_LIBRARY, q("reference", { q: "Realistic walking cycle" }));
  assert.match(titles(walk.items)[0]!, /walk/);

  const ragdoll = searchResources(CURATED_LIBRARY, q("reference", { q: "Ragdoll physics reference" }));
  assert.ok(ragdoll.items.slice(0, 3).every((i) => i.categories.includes("ragdoll")));

  const fall = searchResources(CURATED_LIBRARY, q("reference", { q: "Human falling backwards" }));
  assert.ok(fall.items.some((i) => i.categories.includes("falling")));
});

test("tutorial search focuses on tutorials and matches prefixes as you type", () => {
  const r = searchResources(CURATED_LIBRARY, q("tutorial", { q: "rigi" }));
  assert.ok(r.items.length > 0);
  assert.ok(r.items.every((i) => i.kind === "tutorial"));
  assert.match(titles(r.items)[0]!, /rigify/);
});

test("categories combine with OR, other filters with AND", () => {
  const both = searchResources(CURATED_LIBRARY, q("all", { categories: ["ragdoll", "climbing-traversal"], pageSize: 50 }));
  assert.ok(both.items.every((i) => i.categories.includes("ragdoll") || i.categories.includes("climbing-traversal")));
  const narrowed = searchResources(CURATED_LIBRARY, q("reference", { categories: ["punches"], media: ["live-action"] }));
  assert.ok(narrowed.total > 0);
  assert.ok(narrowed.items.every((i) => i.categories.includes("punches") && i.media.includes("live-action")));
});

test("combined facet filters use real metadata", () => {
  const all = q("all", { pageSize: 50 });
  const combatAnime = searchResources(CURATED_LIBRARY, { ...all, techniques: ["combat"], media: ["anime"] });
  assert.ok(combatAnime.total > 0);
  assert.ok(combatAnime.items.every((i) => i.techniques.includes("combat") && i.media.includes("anime")));

  const mocap = searchResources(CURATED_LIBRARY, { ...all, types: ["mocap"] });
  assert.ok(mocap.total >= 4);
  assert.ok(mocap.items.every((i) => i.contentType === "mocap"));

  const dodging = searchResources(CURATED_LIBRARY, { ...all, movements: ["dodging"] });
  assert.ok(dodging.items.length > 0 && dodging.items.every((i) => i.movements.includes("dodging")));

  const roblox = searchResources(CURATED_LIBRARY, { ...all, software: ["roblox-studio"], levels: ["beginner"] });
  assert.ok(roblox.total > 0);
  assert.ok(roblox.items.every((i) => i.software.includes("roblox-studio") && i.difficulty === "beginner"));

  const gdc = searchResources(CURATED_LIBRARY, { ...all, creators: ["gdc-festival-of-gaming"] });
  assert.ok(gdc.total >= 5);
  assert.ok(gdc.items.every((i) => i.creator === "GDC Festival of Gaming"));
});

test("group filter covers every category in the group", () => {
  const r = searchResources(CURATED_LIBRARY, q("all", { group: "tutorials-workflows", pageSize: 50 }));
  assert.ok(r.total > 0);
  const slugs = ["getting-started", "workflow", "game-animation", "demo-reels", "rigging", "motion-capture", "graph-editor"];
  assert.ok(r.items.every((i) => i.categories.some((c) => slugs.includes(c))));
});

test("tutorial filters: level and software", () => {
  const r = searchResources(CURATED_LIBRARY, q("tutorial", { levels: ["beginner"], software: ["blender"] }));
  assert.ok(r.total > 0);
  assert.ok(r.items.every((i) => i.difficulty === "beginner" && i.software.includes("blender")));
});

test("search finds games, anime and creators by name", () => {
  const gow = searchResources(CURATED_LIBRARY, q("all", { q: "God of War" }));
  assert.ok(gow.items.slice(0, 3).every((i) => i.works?.includes("God of War")));
  const ds = searchResources(CURATED_LIBRARY, q("all", { q: "demon slayer" }));
  assert.ok(ds.total >= 2);
  const creator = searchResources(CURATED_LIBRARY, q("all", { q: "Richard Oud" }));
  assert.ok(creator.items.slice(0, 2).every((i) => i.creator === "Richard Oud" || i.description.includes("Richard Oud")));
  const kick = searchResources(CURATED_LIBRARY, q("all", { q: "kick" }));
  assert.ok(kick.items[0]!.categories.includes("kicks"));
});

test("sorting: newest additions come first", () => {
  const r = searchResources(CURATED_LIBRARY, q("all", { sort: "added", pageSize: 50 }));
  const added = r.items.map((i) => i.addedAt);
  assert.deepEqual(added, [...added].sort().reverse());
  assert.equal(added[0], "2026-10-29T12:00:00Z", "the fourth pass is the newest");
});

test("duration filters only use real duration data", () => {
  assert.equal(durationBucketMatches(null, "short"), false);
  assert.equal(durationBucketMatches(null, "any"), true);
  assert.equal(durationBucketMatches(200, "short"), true);
  assert.equal(durationBucketMatches(600, "medium"), true);
  assert.equal(durationBucketMatches(3600, "long"), true);
  const long = searchResources(CURATED_LIBRARY, q("tutorial", { duration: "long" }));
  assert.ok(long.items.every((i) => (i.durationSeconds ?? 0) > 1200));
});

test("sorting: newest puts dated items first in descending order", () => {
  const r = searchResources(CURATED_LIBRARY, q("tutorial", { sort: "newest", pageSize: 50 }));
  const dates = r.items.map((i) => i.publishedAt);
  const firstNull = dates.indexOf(null);
  const dated = (firstNull === -1 ? dates : dates.slice(0, firstNull)) as string[];
  assert.deepEqual(dated, [...dated].sort().reverse());
  if (firstNull !== -1) assert.ok(dates.slice(firstNull).every((d) => d === null));
});

test("sorting: popular uses view counts and puts unknown counts last", () => {
  const data = CURATED_LIBRARY.filter((r) => r.kind === "reference").slice(0, 3);
  const withViews = data.map((r, i) => ({ ...r, viewCount: i === 1 ? null : (i + 1) * 1000 }));
  const r = searchResources(withViews, q("reference", { sort: "popular" }));
  assert.deepEqual(r.items.map((i) => i.viewCount), [3000, 1000, null]);
});

test("pagination is bounded and reports hasMore", () => {
  const p1 = searchResources(CURATED_LIBRARY, q("reference", { pageSize: 5, page: 1 }));
  const p2 = searchResources(CURATED_LIBRARY, q("reference", { pageSize: 5, page: 2 }));
  assert.equal(p1.items.length, 5);
  assert.equal(p1.hasMore, true);
  assert.notDeepEqual(p1.items.map((i) => i.id), p2.items.map((i) => i.id));
});

test("unavailable videos never appear in results", () => {
  const data = CURATED_LIBRARY.map((r, i) => (i === 0 ? { ...r, availability: "unavailable" as const } : r));
  const r = searchResources(data, q(data[0]!.kind, { pageSize: 50 }));
  assert.ok(!r.items.some((i) => i.id === data[0]!.id));
});

test("related resources share categories or terms", () => {
  const target = CURATED_LIBRARY.find((r) => r.id === "yt-gUFzO12fSak")!;
  const related = relatedResources(target, CURATED_LIBRARY, "reference", 4);
  assert.ok(related.length > 0);
  assert.ok(!related.some((r) => r.id === target.id));
  assert.ok(related[0]!.categories.some((c) => target.categories.includes(c)));
});

// ---- Parameter validation ----
test("strict mode rejects unknown values", () => {
  for (const qs of ["sort=evil", "dur=forever", "cat=not-a-category", "src=example.com", "level=god", "page=999", "cat=<script>"]) {
    const r = parseSearchQuery("reference", new URLSearchParams(qs), { strict: true });
    assert.equal(r.ok, false, qs);
  }
});

test("strict mode rejects over-long queries", () => {
  const r = parseSearchQuery("reference", new URLSearchParams({ q: "a".repeat(200) }), { strict: true });
  assert.equal(r.ok, false);
});

test("lenient mode drops bad values and keeps good ones", () => {
  const r = parseSearchQuery("reference", { q: "walk", cat: "walking,bogus", sort: "evil", dur: "long" });
  assert.ok(r.ok);
  assert.deepEqual(r.query.categories, ["walking"]);
  assert.equal(r.query.sort, "relevance");
  assert.equal(r.query.duration, "long");
});

test("control characters are removed from the query", () => {
  const r = parseSearchQuery("tutorial", new URLSearchParams({ q: "rig\u0000\u0007 ging" }), { strict: true });
  assert.ok(r.ok);
  assert.equal(r.query.q, "rig ging");
});

test("old bookmarked filter values are dropped, not errors (lenient)", () => {
  const r = parseSearchQuery("tutorial", new URLSearchParams("type=slow-motion,breakdown&level=beginner&style=realistic"));
  assert.ok(r.ok);
  assert.deepEqual(r.query.types, ["breakdown"]);
  assert.deepEqual(r.query.levels, ["beginner"]);
});

test("serialise → parse round-trips", () => {
  const first = parseSearchQuery(
    "all",
    new URLSearchParams("q=sword&cat=melee-weapons,parries&group=combat-weapons&sort=added&src=youtube&type=reference,mocap&media=game&tech=combat&move=attacking&sw=any&level=beginner&by=richard-oud&dur=short"),
  );
  assert.ok(first.ok);
  const again = parseSearchQuery(first.query.kind, toSearchParams(first.query), { strict: true });
  assert.ok(again.ok);
  assert.deepEqual(again.query, first.query);
});

test("search works in Russian, Japanese and Chinese", () => {
  const ru = searchResources(CURATED_LIBRARY, q("reference", { q: "удар" }));
  assert.ok(ru.items.some((i) => i.categories.includes("punches")), "ru: удар → punches");
  const ruMedia = searchResources(CURATED_LIBRARY, q("all", { q: "аниме" }));
  assert.ok(ruMedia.items.some((i) => i.media.includes("anime")), "ru: аниме → anime videos");
  const ru2 = searchResources(CURATED_LIBRARY, q("tutorial", { q: "риггинг" }));
  assert.ok(ru2.total > 0, "ru: риггинг");
  const ja = searchResources(CURATED_LIBRARY, q("reference", { q: "パンチ" }));
  assert.ok(ja.total > 0, "ja: パンチ");
  const zh = searchResources(CURATED_LIBRARY, q("reference", { q: "布娃娃" }));
  assert.ok(zh.items.some((i) => i.categories.includes("ragdoll")), "zh: 布娃娃 → ragdoll");
});
