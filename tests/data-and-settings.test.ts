import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_CATEGORIES, CATEGORY_GROUPS, deriveFacets } from "@/lib/config/categories";
import { CURATED_LIBRARY, validateRecord } from "@/lib/data";
import { REFERENCES } from "@/lib/data/references";
import { TUTORIALS } from "@/lib/data/tutorials";
import { YOUTUBE_SNAPSHOT } from "@/lib/data/youtube-snapshot";
import { formatDuration, parseIsoDuration } from "@/lib/format";
import { DEFAULT_SETTINGS, parseSettings } from "@/lib/settings/schema";
import { DESCRIPTIONS_I18N } from "@/lib/data/descriptions-i18n";
import { THIRD_SAKUGA, THIRD_YOUTUBE } from "@/lib/data/collection-3";
import { FOURTH_PASS } from "@/lib/data/collection-4";
import { describe as describeIn } from "@/lib/i18n";
import { categoryName, detectLocale, groupName, plural, tagName, translate } from "@/lib/i18n";

test("every curated record passes validation and none were dropped", () => {
  for (const r of CURATED_LIBRARY) assert.deepEqual(validateRecord(r), [], r.id);
  assert.equal(CURATED_LIBRARY.length, REFERENCES.length + TUTORIALS.length + THIRD_YOUTUBE.length + THIRD_SAKUGA.length + FOURTH_PASS.length);
  assert.equal(new Set(CURATED_LIBRARY.map((r) => r.id)).size, CURATED_LIBRARY.length);
});

test("curated records never claim facts that weren't verified", () => {
  for (const r of CURATED_LIBRARY) {
    assert.ok(r.verification, r.id);
    if (r.verification!.method === "search-listing") {
      assert.equal(r.creator, null, `${r.id}: listing-only records must not name a creator`);
      assert.equal(r.publishedAt, null, `${r.id}: listing-only records must not claim a date`);
    }
    if (r.source === "youtube") {
      const snap = YOUTUBE_SNAPSHOT[r.youtubeId!];
      assert.ok(snap, `${r.id}: YouTube facts must come from the watch-page snapshot`);
      assert.equal(r.title, snap!.title);
      assert.equal(r.creator, snap!.channel);
      assert.equal(r.durationSeconds, snap!.lengthSeconds);
    } else {
      assert.equal(r.viewCount, null, `${r.id}: view counts only come from YouTube`);
    }
  }
});

test("category system: eight groups (incl. FPS), unique slugs, every category in use", () => {
  assert.equal(CATEGORY_GROUPS.length, 8);
  assert.deepEqual(
    CATEGORY_GROUPS.map((g) => g.slug),
    ["character-movement", "combat-weapons", "first-person", "body-mechanics-physics", "character-acting", "animation-principles", "cinematics", "tutorials-workflows"],
  );
  assert.equal(new Set(ALL_CATEGORIES.map((c) => c.slug)).size, ALL_CATEGORIES.length);
  const used = new Set(CURATED_LIBRARY.flatMap((r) => r.categories));
  for (const c of ALL_CATEGORIES) assert.ok(used.has(c.slug), `category ${c.slug} has no videos`);
});

test("techniques and movements are derived from categories, never hand-entered", () => {
  for (const r of CURATED_LIBRARY) {
    const derived = deriveFacets(r.categories);
    assert.deepEqual(r.techniques, derived.techniques, r.id);
    assert.deepEqual(r.movements, derived.movements, r.id);
  }
  const punch = CURATED_LIBRARY.find((r) => r.id === "yt-gUFzO12fSak")!;
  assert.ok(punch.techniques.includes("combat") && punch.movements.includes("attacking"));
});

test("library quality: no duplicate videos, real metadata, every content type and source covered", () => {
  const youtubeIds = CURATED_LIBRARY.map((r) => r.youtubeId).filter(Boolean);
  assert.equal(new Set(youtubeIds).size, youtubeIds.length, "the same video is listed twice");
  for (const r of CURATED_LIBRARY) {
    if (r.source !== "youtube") continue;
    assert.ok(r.durationSeconds && r.durationSeconds > 0, `${r.id}: duration from the watch page`);
    assert.ok(r.publishedAt, `${r.id}: publish date from the watch page`);
    assert.ok(r.tags.length >= 2, `${r.id}: relevant tags`);
  }
  for (const type of ["reference", "tutorial", "breakdown", "mocap"]) {
    assert.ok(CURATED_LIBRARY.some((r) => r.contentType === type), `content type ${type}`);
  }
  for (const m of ["game", "anime", "film", "animation", "live-action"]) {
    assert.ok(CURATED_LIBRARY.some((r) => r.media.includes(m as never)), `source ${m}`);
  }
  assert.ok(CURATED_LIBRARY.length >= 500);
  // Archived key animation: every cut credits its artists and links to its own post.
  for (const r of THIRD_SAKUGA) {
    assert.match(r.url, /^https:\/\/www\.sakugabooru\.com\/post\/show\/\d+$/, r.id);
    assert.ok(r.creator && r.works?.length, `${r.id}: credited artist and work`);
    assert.ok(r.thumbnail?.url.startsWith("/thumbs/sb-"), `${r.id}: captured frame`);
  }
});

test("duration formatting matches the spec", () => {
  assert.equal(formatDuration(155), "02:35");
  assert.equal(formatDuration(768), "12:48");
  assert.equal(formatDuration(5076), "01:24:36");
  assert.equal(formatDuration(null), null);
  assert.equal(formatDuration(0), null);
  assert.equal(parseIsoDuration("PT1H24M36S"), 5076);
  assert.equal(parseIsoDuration("PT45S"), 45);
  assert.equal(parseIsoDuration("P1DT1S"), 86401);
  assert.equal(parseIsoDuration("garbage"), null);
});

test("settings: defaults and validation", () => {
  assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
  assert.equal(DEFAULT_SETTINGS.theme, "dark");
  assert.equal(DEFAULT_SETTINGS.showTimestamps, true);
  assert.deepEqual(parseSettings({ theme: "neon", language: "xx", showTimestamps: "yes", reduceMotion: true, extra: 1 }), {
    theme: "dark",
    language: "en",
    showTimestamps: true,
    reduceMotion: true,
  });
  assert.equal(parseSettings({ theme: "dark-brown" }).theme, "dark-brown");
  assert.equal(parseSettings({ language: "ru" }).language, "ru");
  assert.equal(parseSettings({}, "ja").language, "ja", "falls back to the browser's language");
});

test("i18n: every language covers every record, category and plural form", () => {
  for (const locale of ["ru", "ja", "zh"] as const) {
    for (const r of CURATED_LIBRARY) {
      // Hand-written translations, or a batch template rendered in this language.
      const text = describeIn(locale, r);
      assert.ok(DESCRIPTIONS_I18N[locale][r.id]?.description || (r.blurb && text && text !== r.description), `${locale}: description for ${r.id}`);
      assert.doesNotMatch(text, /undefined|\$\{/, `${locale}: template filled for ${r.id}`);
      for (const c of r.categories) assert.notEqual(categoryName(locale, c), c, `${locale}: category ${c}`);
    }
    for (const g of CATEGORY_GROUPS) assert.notEqual(groupName(locale, g.slug), g.label, `${locale}: group ${g.slug}`);
    for (const c of ALL_CATEGORIES) assert.notEqual(categoryName(locale, c.slug), c.label, `${locale}: category ${c.slug}`);
  }
  assert.equal(plural("ru", "count.reference", 1), "1 референс");
  assert.match(plural("ru", "count.reference", 3), /^3 /);
  assert.match(plural("ru", "count.reference", 5), /^5 /);
  assert.notEqual(plural("ru", "count.reference", 3), plural("ru", "count.reference", 5));
  assert.equal(translate("ja", "nav.settings"), "設定");
  assert.equal(detectLocale(["ru-RU", "en"]), "ru");
  assert.equal(detectLocale(["zh-TW"]), "zh");
  assert.equal(detectLocale(["de-DE"]), "en");
  assert.equal(tagName("ru", "punch"), "удар кулаком");
  assert.equal(tagName("ru", "rigify"), "rigify");
});

test("platforms: every platform page has a real set of tutorials, from beginner up", async () => {
  const { PLATFORMS, isPlatformTutorial } = await import("@/lib/config/platforms");
  assert.deepEqual(PLATFORMS.map((p) => p.slug), ["roblox-studio", "blender", "maya", "cinema-4d"]);
  for (const p of PLATFORMS) {
    const items = CURATED_LIBRARY.filter((r) => isPlatformTutorial(r, p));
    assert.ok(items.length >= 15, `${p.slug}: ${items.length} tutorials`);
    assert.ok(items.some((r) => r.difficulty === "beginner"), `${p.slug}: has beginner tutorials`);
  }
  const fps = CURATED_LIBRARY.filter((r) => r.categories.some((c) => c.startsWith("fps-")));
  assert.ok(fps.length >= 50, `FPS section: ${fps.length} videos`);
});
