import { deriveFacets } from "@/lib/config/categories";
import { blurbText, blurbNote } from "@/lib/data/templates";
import { YOUTUBE_SNAPSHOT, YOUTUBE_SNAPSHOT_DATE } from "@/lib/data/youtube-snapshot";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/security/url";
import type { Resource } from "@/lib/types";

/**
 * Helpers for writing curated records. Facts (title, creator, dates, URLs) must
 * be copied exactly from the source page; descriptions are our own summaries.
 * See guides/CONTENT.md for the verification checklist.
 */

type Base = Omit<
  Resource,
  | "techniques"
  | "movements"
  | "software"
  | "id"
  | "url"
  | "source"
  | "format"
  | "thumbnail"
  | "youtubeId"
  | "origin"
  | "availability"
  | "viewCount"
  | "durationSeconds"
  | "title"
  | "creator"
  | "publishedAt"
  | "verification"
> & {
  durationSeconds?: number | null;
  /** Defaults to ["any"] (general animation). */
  software?: Resource["software"];
};

/**
 * A YouTube video. Title, channel, publish date, duration and views come from
 * the watch-page snapshot (lib/data/youtube-snapshot.ts); the watch URL and
 * thumbnail are derived from the validated id.
 */
export function youtube(videoId: string, data: Base): Resource {
  const snap = YOUTUBE_SNAPSHOT[videoId];
  if (!snap) throw new Error(`[library] yt-${videoId}: no metadata snapshot — read the watch page first`);
  return withBlurb({
    ...data,
    software: data.software ?? ["any"],
    ...deriveFacets(data.categories),
    id: `yt-${videoId}`,
    title: snap.title,
    creator: snap.channel,
    publishedAt: snap.publishDate,
    url: youtubeWatchUrl(videoId),
    source: "youtube",
    format: "video",
    thumbnail: youtubeThumbnail(videoId),
    youtubeId: videoId,
    origin: "curated",
    availability: "available",
    viewCount: snap.viewCount,
    durationSeconds: snap.lengthSeconds,
    verification: { method: "source-page", checkedAt: snap.checkedAt ?? YOUTUBE_SNAPSHOT_DATE },
  });
}

/** Records with a `blurb` get their English description (and note) from the shared templates. */
function withBlurb(resource: Resource): Resource {
  if (!resource.blurb) return resource;
  return {
    ...resource,
    description: resource.description || blurbText("en", resource),
    accessNote: resource.accessNote ?? blurbNote("en", resource),
  };
}

/**
 * A key-animation cut archived on Sakugabooru. Every fact comes from the post:
 * the work from its copyright tag, the creator from its artist tags, the duration
 * from the video file. The frame shown on the card was captured from the clip and
 * is served by this site (public/thumbs/sb-<post>.webp); the video itself stays on
 * Sakugabooru.
 */
export function sakuga(
  postId: number,
  title: string,
  creator: string,
  works: string[],
  durationSeconds: number | null,
  media: Resource["media"],
  contentType: Resource["contentType"],
  categories: string[],
  tags: string[],
): Resource {
  return withBlurb({
    id: `sb-${postId}`,
    kind: "reference",
    title,
    description: "",
    url: `https://www.sakugabooru.com/post/show/${postId}`,
    source: "sakugabooru",
    creator,
    format: "video",
    durationSeconds,
    publishedAt: null,
    addedAt: ADDED_3,
    thumbnail: { url: `/thumbs/sb-${postId}.webp`, width: 320, height: 180 },
    categories,
    tags,
    viewCount: null,
    availability: "available",
    origin: "curated",
    verification: { method: "source-page", checkedAt: "2026-10-28" },
    contentType,
    media,
    works,
    software: ["any"],
    ...deriveFacets(categories),
    blurb: contentType === "breakdown" ? "genga" : "sakuga",
  });
}

type ExternalBase = Omit<
  Resource,
  "thumbnail" | "youtubeId" | "origin" | "availability" | "viewCount" | "durationSeconds" | "techniques" | "movements" | "software"
> & { thumbnail?: Resource["thumbnail"]; durationSeconds?: number | null; software?: Resource["software"] };

/** A non-YouTube resource (course, documentation, dataset, article). */
export function external(data: ExternalBase): Resource {
  return {
    ...data,
    software: data.software ?? ["any"],
    ...deriveFacets(data.categories),
    thumbnail: data.thumbnail ?? null,
    origin: "curated",
    availability: "unknown",
    viewCount: null,
    durationSeconds: data.durationSeconds ?? null,
  };
}

export const CHECKED = { method: "source-page", checkedAt: "2026-10-26" } as const;
/** First curation pass. */
export const ADDED = "2026-10-26";
/** Second pass: playlist review and official channels. */
export const ADDED_2 = "2026-10-28";
/** Third pass: the "Ref ideas" playlist and AnimationReference.org (Sakugabooru) — sorts after ADDED_2. */
export const ADDED_3 = "2026-10-28T16:00:00Z";
/** Fourth pass: FPS, weapons and platform tutorials. */
export const ADDED_4 = "2026-10-29T12:00:00Z";
/** Fifth pass: fight animation and short practice clips. */
export const ADDED_5 = "2026-10-29T16:00:00Z";
