/**
 * Core data model shared by the library, search engine, source adapters and UI.
 * Keep this file free of runtime code so it can be imported anywhere.
 */

export type ResourceKind = "reference" | "tutorial";

/** Identifiers of supported source platforms. See lib/config/sources.ts. */
export type SourceId =
  | "youtube"
  | "vimeo"
  | "blender-studio"
  | "blender-manual"
  | "roblox-creator-hub"
  | "wikipedia"
  | "github"
  | "sakugabooru";

/** What the original resource is. Drives the call-to-action label. */
export type ResourceFormat = "video" | "course" | "article" | "dataset" | "photo-study";

/**
 * What kind of video or page this is, across both libraries:
 * - reference:  footage or finished animation to study (incl. professional reels)
 * - tutorial:   step-by-step instruction
 * - breakdown:  analysis of how something was made (talks, essays, progressions)
 * - mocap:      motion-capture sessions, behind-the-scenes or data
 */
export type ContentType = "reference" | "tutorial" | "breakdown" | "mocap";

/** Where the footage itself comes from ("Source" filter). */
export type Medium = "game" | "anime" | "film" | "animation" | "live-action";

/** Animation technique ("Technique" filter). Derived from categories — see lib/config/categories.ts. */
export type Technique = "combat" | "body-mechanics" | "physics" | "locomotion" | "acting" | "cinematics";

/** Movement shown ("Movement" filter). Derived from categories. */
export type Movement = "walking" | "running" | "jumping" | "falling" | "attacking" | "blocking" | "dodging";

/** Library scope of a search: one library or everything. */
export type LibraryScope = ResourceKind | "all";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Software =
  | "blender"
  | "roblox-studio"
  | "maya"
  | "3ds-max"
  | "unreal-engine"
  | "unity"
  | "cinema-4d"
  | "any";

/**
 * - available:   confirmed playable/reachable by the last metadata check
 * - unavailable: the platform reports it deleted, private or blocked
 * - restricted:  reachable but age-restricted or otherwise limited
 * - unknown:     no live check has been made (e.g. no API key configured)
 */
export type Availability = "available" | "unavailable" | "restricted" | "unknown";

/** Where a record came from. Live results are never mixed into the curated library silently. */
export type ResourceOrigin = "curated" | "live";

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface Verification {
  /**
   * How the record was confirmed:
   * - source-page:      title, creator and date read from the resource's own page
   * - search-listing:   title and URL confirmed from the platform's listing; creator/date not yet confirmed
   * - youtube-data-api: all facts from the official API (live hydration)
   */
  method: "source-page" | "search-listing" | "youtube-data-api";
  /** ISO date of the last check. */
  checkedAt: string;
}

export interface Resource {
  /** Stable, URL-safe id. YouTube items use `yt-<videoId>`. */
  id: string;
  kind: ResourceKind;
  title: string;
  /** Editorial summary written for this library (never copied from the source). */
  description: string;
  /** Verified original URL. The resource always stays hosted there. */
  url: string;
  source: SourceId;
  /** Creator or channel name exactly as shown on the source; null if not verified. */
  creator: string | null;
  format: ResourceFormat;
  /** Length in seconds from trusted metadata only. Never estimated. */
  durationSeconds: number | null;
  /** ISO date (YYYY-MM-DD) the source published it, when known. */
  publishedAt: string | null;
  /** ISO date it was added to this library. */
  addedAt: string;
  thumbnail: Thumbnail | null;
  /** Category slugs: reference categories for references, tutorial topics for tutorials. */
  categories: string[];
  tags: string[];
  /** YouTube video id when source === "youtube". */
  youtubeId?: string;
  viewCount: number | null;
  availability: Availability;
  origin: ResourceOrigin;
  verification: Verification | null;
  /** Editorial curation weight used for "Featured" rows (higher first). */
  featured?: number;

  contentType: ContentType;
  /** Where the footage comes from; empty when it doesn't apply (e.g. a software lesson). */
  media: Medium[];
  /** Games, films or series shown in the video, as officially titled. Searchable. */
  works?: string[];
  /** Derived from categories when the library is built (never hand-entered). */
  techniques: Technique[];
  /** Derived from categories when the library is built (never hand-entered). */
  movements: Movement[];
  /** Tools used or taught; "any" means general animation that applies to every tool. */
  software: Software[];
  /** Editorial difficulty rating; null/undefined when not rated. */
  difficulty?: Difficulty | null;
  /** Short note shown on the details page, e.g. membership requirements. */
  accessNote?: string;
  /**
   * For large batches of similar records (archived key-animation cuts, demo
   * reels) the description is generated from the record's own verified fields
   * in every language — see lib/data/templates.ts.
   */
  blurb?: BlurbKind;
}

export type BlurbKind = "sakuga" | "genga" | "reel" | "student-reel" | "studio-reel" | "rig-reel";

/** relevance · added (newest additions to this library) · newest (publish date) · popular (views). */
export type SortOrder = "relevance" | "added" | "newest" | "popular";

export type DurationBucket = "any" | "short" | "medium" | "long";

/**
 * A library search. Values inside one filter combine with OR; different filters
 * combine with AND (e.g. Combat + Anime = combat videos from anime).
 */
export interface SearchQuery {
  kind: LibraryScope;
  q: string;
  /** Selected category slugs (OR within the selection). */
  categories: string[];
  /** Optional category group slug (narrows to all categories in the group). */
  group: string | null;
  sort: SortOrder;
  duration: DurationBucket;
  types: ContentType[];
  media: Medium[];
  techniques: Technique[];
  movements: Movement[];
  software: Software[];
  levels: Difficulty[];
  /** Creator keys (see creatorKey in lib/format.ts). */
  creators: string[];
  /** Hosting platform; kept for API compatibility, not shown as a filter. */
  sources: SourceId[];
  page: number;
  pageSize: number;
}

export interface SearchResultPage {
  items: Resource[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface LiveSearchPage {
  enabled: boolean;
  items: Resource[];
  nextPageToken: string | null;
  /** Machine-readable reason when no results could be fetched. */
  error: "not-configured" | "quota" | "upstream" | "timeout" | null;
}
