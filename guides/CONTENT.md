# Adding content

The library's value depends on every record being real and attributable. Follow these steps exactly.

## Add a resource

1. Open the resource's own page (the YouTube watch page, the course page, the docs page). Don't work from search results or memory.
2. Copy **exactly** as shown on the page:
   - title (including suffixes like "| Video Essay")
   - creator or channel name
   - publish date (YYYY-MM-DD) — leave `null` if the page gives only a year or nothing
   - the canonical URL
3. Write a **description in your own words** (one or two sentences on what an animator will learn or study). Don't paste the creator's description.
4. Pick categories from `lib/config/categories.ts` (references use reference categories; tutorials use tutorial topics) and 3–5 lowercase tags.
5. **Don't add a duration** for YouTube videos — it comes from the YouTube Data API at runtime. For other sources, only add a duration the page states (e.g. a course's total runtime).
6. Add it to `lib/data/references.ts` or `lib/data/tutorials.ts`:

```ts
youtube("VIDEO_ID", {
  ...base,                 // kind, addedAt, verification: { method: "source-page", checkedAt }
  title: "Exact title from the page",
  creator: "Exact channel name",
  publishedAt: "2024-03-30",
  description: "Your own one-sentence summary.",
  categories: ["punches", "hit-reactions"],
  tags: ["punch", "impact"],
  referenceType: "slow-motion",  // references only
  style: "realistic",            // references only
  // tutorials only: difficulty: "beginner", software: ["blender"]
}),
```

For non-YouTube resources use `external({ id, url, source, format, ... })`.

If you could confirm the title and link from the platform's listing but couldn't open the page to confirm the channel and date, use the `listed` base in `references.ts`: creator and date stay `null` and the UI says so. Replace it with a fully verified record once you can.

7. Update `ADDED` in `lib/data/helpers.ts` (or set `addedAt` on the record) so "Recently Added" stays accurate.
8. Run `npm run verify:data` and `npm test`. A record with a URL outside the allowlist, an unknown category or a duplicate id fails both.

## Add a category or tutorial topic

Add an entry to `REFERENCE_GROUPS` or `TUTORIAL_TOPIC_GROUPS` in `lib/config/categories.ts`. Keywords help search match it. It appears in filters, the Categories page and search immediately.

## Add a source platform

1. Add an id to `SourceId` in `lib/types.ts`.
2. Add its entry to `SOURCES` in `lib/config/sources.ts` with the exact hostnames links may use (subdomains are not implied).
3. If it has thumbnails you're permitted to display, add the image host to `THUMBNAIL_HOSTS` (this also updates the image optimizer allowlist and CSP).
4. For live search, implement `LiveSearchAdapter` (`lib/sources/types.ts`), add its API host to `OUTBOUND_API_HOSTS`, and register it in `lib/sources/registry.ts`. Follow the platform's API terms for caching and attribution.

## Periodic maintenance

With `YOUTUBE_API_KEY` set, `npm run verify:data` reports videos that were deleted, made private or age-restricted, titles that changed, and channels confirmed for listing-only records. Run it on a schedule (for example a weekly CI job) and fix what it reports. Unavailable videos are already hidden from the site automatically in the meantime.
