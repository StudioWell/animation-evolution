import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DB_RULES,
  GENRES,
  genreCategories,
  isUnseenDecision,
  newSubmissionId,
  parseAuthorDoc,
  parseSubmission,
  parseVideoLink,
} from "@/lib/community/model";
import { isKnownCategory } from "@/lib/config/categories";

const base = {
  title: "  Sword swing breakdown ",
  description: "Arcs and overlap",
  kind: "tutorial",
  platform: "blender",
  genres: ["weapons", "action", "nope", "weapons"],
  video: { type: "link", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  status: "pending",
  createdAt: "2026-10-29T10:00:00Z",
};

test("parseSubmission keeps valid fields and drops unknown genres", () => {
  const s = parseSubmission(base, "vabc123", "user_1");
  assert.ok(s);
  assert.equal(s.title, "Sword swing breakdown");
  assert.deepEqual(s.genres, ["weapons", "action"]);
  assert.equal(s.status, "pending");
  assert.equal(s.reviewedAt, null);
});

test("parseSubmission rejects bad records", () => {
  assert.equal(parseSubmission({ ...base, title: "" }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, kind: "other" }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, platform: "unity" }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, genres: [] }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, video: { type: "link", url: "https://evil.example/x" } }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, video: { type: "link", url: "javascript:alert(1)" } }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, video: { type: "upload", assetId: "../x", contentType: "video/mp4" } }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, video: { type: "upload", assetId: "a".repeat(32), contentType: "text/html" } }, "vabc123", "u"), null);
  assert.equal(parseSubmission(base, "../x", "u"), null);
});

test("uploads with a known video type are accepted", () => {
  const s = parseSubmission({ ...base, video: { type: "upload", assetId: "0123456789abcdef0123456789abcdef", contentType: "video/mp4", size: 1000 } }, "vabc123", "u");
  assert.equal(s?.video.type, "upload");
});

test("only YouTube and Vimeo links are accepted", () => {
  assert.ok(parseVideoLink("https://youtu.be/dQw4w9WgXcQ"));
  assert.ok(parseVideoLink("https://vimeo.com/76979871"));
  assert.equal(parseVideoLink("https://example.com/video.mp4"), null);
  assert.equal(parseVideoLink("not a url"), null);
});

test("author documents parse newest first and skip broken items", () => {
  const list = parseAuthorDoc(
    { items: { vold000: { ...base, createdAt: "2026-10-01T00:00:00Z" }, vnew000: { ...base, createdAt: "2026-10-20T00:00:00Z" }, vbad000: { title: 1 } } },
    "u1",
  );
  assert.deepEqual(list.map((s) => s.id), ["vnew000", "vold000"]);
  assert.deepEqual(parseAuthorDoc(undefined, "u1"), []);
});

test("a decision is unseen until the author acknowledges it", () => {
  const s = parseSubmission({ ...base, status: "rejected", reason: "Too short", reviewedAt: "2026-10-29T12:00:00Z" }, "vabc123", "u")!;
  assert.equal(isUnseenDecision(s), true);
  assert.equal(isUnseenDecision({ ...s, seenAt: "2026-10-29T12:05:00Z" }), false);
  assert.equal(isUnseenDecision({ ...s, status: "pending" }), false);
});

test("submission ids are unique and valid", () => {
  const ids = new Set(Array.from({ length: 200 }, newSubmissionId));
  assert.equal(ids.size, 200);
  for (const id of ids) assert.match(id, /^[A-Za-z0-9_-]{6,64}$/);
});

test("genres map to real library categories", () => {
  for (const g of GENRES) for (const c of g.categories) assert.ok(isKnownCategory(c), `${g.slug} → ${c}`);
  assert.ok(genreCategories(["weapons"]).length > 0);
});

test("only the owner can publish; authors write only their own submissions", () => {
  const published = DB_RULES.find((r) => r.path === "published");
  assert.equal(published?.write, "owner");
  assert.equal(DB_RULES.find((r) => r.path === "submissions")?.read, "admin");
  assert.equal(DB_RULES.find((r) => r.path === "submissions/{self}")?.write, "interact");
});

test("Firestore updates touch only the named leaves", async () => {
  const { toFieldPaths } = await import("@/lib/firebase/client");
  assert.deepEqual(toFieldPaths({ items: { vabc123: { status: "rejected", reason: "x", video: { type: "link", url: "u" } } } }), {
    "items.vabc123.status": "rejected",
    "items.vabc123.reason": "x",
    "items.vabc123.video.type": "link",
    "items.vabc123.video.url": "u",
  });
  assert.deepEqual(toFieldPaths({ genres: ["a"], reviewedAt: null }), { genres: ["a"], reviewedAt: null });
});

test("uploaded videos may only point at Firebase Storage", () => {
  const upload = { type: "upload", assetId: "0123456789abcdef0123456789abcdef", contentType: "video/mp4", size: 1 };
  assert.ok(parseSubmission({ ...base, video: { ...upload, url: "https://firebasestorage.googleapis.com/v0/b/x/o/videos%2Fu%2F1?alt=media&token=t" } }, "vabc123", "u"));
  assert.equal(parseSubmission({ ...base, video: { ...upload, url: "https://evil.example/v.mp4" } }, "vabc123", "u"), null);
  assert.equal(parseSubmission({ ...base, video: { ...upload, url: "http://firebasestorage.googleapis.com/x" } }, "vabc123", "u"), null);
});

test("the owner rules name a placeholder, not a real address, in the repository", async () => {
  const { readFileSync } = await import("node:fs");
  for (const f of ["firebase/firestore.rules", "firebase/storage.rules"]) {
    const text = readFileSync(f, "utf8");
    assert.match(text, /OWNER_EMAIL/);
    assert.doesNotMatch(text, /@gmail\.com/);
  }
  assert.match(readFileSync("firebase/firestore.rules", "utf8"), /match \/published\/\{id\} \{\s+allow read: if true;\s+allow write: if isOwner\(\);/);
});
