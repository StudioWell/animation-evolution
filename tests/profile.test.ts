import assert from "node:assert/strict";
import test from "node:test";
import { CURATED_LIBRARY } from "@/lib/data";
import { readIdToken } from "@/lib/profile/google";
import { cleanName, parseAccount, parseProfile, SAVED_MAX } from "@/lib/profile/storage";
import { MAX_ITEM_IDS, parseItemIds, pickResources } from "@/lib/search/items";
import { buildContentSecurityPolicy } from "@/lib/security/headers";

const b64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = (claims: Record<string, unknown>) => `${b64url({ alg: "RS256" })}.${b64url(claims)}.sig`;
const CLIENT = "1234-abc.apps.googleusercontent.com";

test("google: ID tokens are only accepted for this client, from Google, unexpired", () => {
  const now = Date.UTC(2026, 9, 28);
  const good = { iss: "https://accounts.google.com", aud: CLIENT, sub: "1098", email: "a@b.c", name: "Ana", exp: now / 1000 + 600 };
  assert.deepEqual(readIdToken(token(good), CLIENT, now), { sub: "1098", email: "a@b.c", name: "Ana" });
  assert.equal(readIdToken(token({ ...good, aud: "other" }), CLIENT, now), null);
  assert.equal(readIdToken(token({ ...good, iss: "https://evil.example" }), CLIENT, now), null);
  assert.equal(readIdToken(token({ ...good, exp: now / 1000 - 1 }), CLIENT, now), null);
  assert.equal(readIdToken("not-a-token", CLIENT, now), null);
});

test("profile: stored data is validated before use", () => {
  assert.equal(cleanName("  Ana \n  Petrova  "), "Ana Petrova");
  assert.equal(cleanName("x".repeat(80)).length, 40);
  assert.equal(parseProfile({ name: "   " }), null, "a profile needs a name");
  const p = parseProfile({
    name: "Ana",
    photo: "javascript:alert(1)",
    saved: ["yt-abc", "yt-abc", "bad id!", 3, ...Array.from({ length: 300 }, (_, i) => `id-${i}`)],
    updatedAt: "2026-10-28T10:00:00Z",
  })!;
  assert.equal(p.photo, null, "only image data URLs are kept");
  assert.equal(p.saved[0], "yt-abc");
  assert.equal(new Set(p.saved).size, p.saved.length);
  assert.equal(p.saved.length, SAVED_MAX);
  assert.equal(parseAccount({ provider: "google", id: "1098" })?.provider, "google");
  assert.equal(parseAccount({ provider: "admin", id: "1" }), null);
});

test("saved items endpoint: strict ids, library order kept as asked", () => {
  assert.deepEqual(parseItemIds(null), { ok: true, ids: [] });
  assert.equal(parseItemIds("a,<b>").ok, false);
  assert.equal(parseItemIds(Array.from({ length: MAX_ITEM_IDS + 1 }, (_, i) => `x${i}`).join(",")).ok, false);
  const [a, b] = [CURATED_LIBRARY[5]!, CURATED_LIBRARY[400]!];
  assert.deepEqual(pickResources(CURATED_LIBRARY, [b.id, "missing", a.id]).map((r) => r.id), [b.id, a.id]);
});

test("CSP allows Google sign-in and Firebase and nothing else third-party for scripts", () => {
  const csp = buildContentSecurityPolicy(false);
  const scripts = (csp.match(/script-src ([^;]+)/)?.[1] ?? "").split(" ");
  assert.deepEqual(scripts, ["'self'", "'unsafe-inline'", "https://accounts.google.com/gsi/client", "https://www.gstatic.com/firebasejs/", "https://apis.google.com"]);
  assert.match(csp, /frame-src https:\/\/accounts\.google\.com\/gsi\//);
  assert.match(csp, /frame-ancestors 'none'/);
});
