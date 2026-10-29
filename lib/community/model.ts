import { detectSource } from "@/lib/security/url";

/**
 * Community videos: registered visitors submit their own reference or tutorial
 * videos; the site owner reviews every submission before it becomes public.
 *
 * Storage (the claude.ai artifact database, or Firestore on the public site —
 * see lib/community/runtime.ts and firebase/firestore.rules):
 *   submissions/<authorId>   one document per author, `items` keyed by
 *                            submission id. The author reads and writes
 *                            their own document; only the owner can read
 *                            everyone's (to review them).
 *   published/<submissionId> approved videos. Only the owner can write
 *                            here, so an author can never publish themselves.
 * Everything read back is validated with parseSubmission() before use.
 */

export const PLATFORM_CHOICES = ["roblox-studio", "blender", "maya", "cinema-4d", "other"] as const;
export type PlatformChoice = (typeof PLATFORM_CHOICES)[number];

/** Genres a submitter can pick (1–3), each mapped to library categories for search and display. */
export const GENRES = [
  { slug: "action", categories: ["fight-choreography", "action-scenes"] },
  { slug: "weapons", categories: ["melee-weapons", "firearms"] },
  { slug: "fps", categories: ["fps-weapons"] },
  { slug: "movement", categories: ["walking", "running"] },
  { slug: "acting", categories: ["body-language", "emotions"] },
  { slug: "creatures", categories: ["creatures"] },
  { slug: "stylized", categories: ["stylized"] },
  { slug: "body-mechanics", categories: ["weight-balance", "momentum"] },
  { slug: "cinematic", categories: ["camera", "cutscenes"] },
  { slug: "game", categories: ["game-animation"] },
  { slug: "rigging", categories: ["rigging"] },
  { slug: "other", categories: [] },
] as const;
export type GenreSlug = (typeof GENRES)[number]["slug"];
const GENRE_SLUGS = GENRES.map((g) => g.slug) as readonly string[];

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type SubmissionVideo =
  | { type: "upload"; assetId: string; contentType: string; size: number; url?: string }
  | { type: "link"; url: string };

export interface Submission {
  id: string;
  authorId: string;
  /** The name from the author's site profile, at submission time. */
  authorName: string;
  title: string;
  description: string;
  kind: "reference" | "tutorial";
  platform: PlatformChoice;
  genres: GenreSlug[];
  video: SubmissionVideo;
  status: SubmissionStatus;
  /** Reason given by the reviewer when a video is rejected or removed. */
  reason: string;
  createdAt: string;
  reviewedAt: string | null;
  /** When the author last saw the review result (notifications). */
  seenAt: string | null;
}

export const LIMITS = { title: 100, description: 1000, reason: 500, genres: 3, uploadBytes: 20 * 1024 * 1024 } as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

const ID = /^[A-Za-z0-9_-]{6,64}$/;
const AUTHOR = /^[A-Za-z0-9_.:-]{1,128}$/;
const ASSET = /^[0-9a-f]{32}$/;
const ISO = (v: unknown) => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max) : "");

/** Links people may submit: the video platforms the library already trusts. */
export function parseVideoLink(raw: string): string | null {
  const value = raw.trim();
  const source = detectSource(value);
  return source === "youtube" || source === "vimeo" ? value : null;
}

export function parseSubmission(raw: unknown, id: string, authorId: string): Submission | null {
  if (!raw || typeof raw !== "object" || !ID.test(id) || !AUTHOR.test(authorId)) return null;
  const r = raw as Record<string, unknown>;
  const title = text(r.title, LIMITS.title);
  if (!title) return null;
  const kind = r.kind === "tutorial" ? "tutorial" : r.kind === "reference" ? "reference" : null;
  const platform = PLATFORM_CHOICES.includes(r.platform as PlatformChoice) ? (r.platform as PlatformChoice) : null;
  const genres = Array.isArray(r.genres) ? [...new Set(r.genres.filter((g): g is GenreSlug => GENRE_SLUGS.includes(g as string)))].slice(0, LIMITS.genres) : [];
  if (!kind || !platform || genres.length === 0) return null;
  const v = (r.video ?? {}) as Record<string, unknown>;
  let video: SubmissionVideo | null = null;
  if (v.type === "upload" && typeof v.assetId === "string" && ASSET.test(v.assetId) && VIDEO_TYPES.includes(v.contentType as (typeof VIDEO_TYPES)[number])) {
    video = { type: "upload", assetId: v.assetId, contentType: v.contentType as string, size: typeof v.size === "number" ? v.size : 0 };
    if (typeof v.url === "string") {
      if (!isStorageUrl(v.url)) return null;
      video.url = v.url;
    }
  } else if (v.type === "link" && typeof v.url === "string") {
    const url = parseVideoLink(v.url);
    if (url) video = { type: "link", url };
  }
  if (!video) return null;
  const status: SubmissionStatus = r.status === "approved" || r.status === "rejected" ? r.status : "pending";
  return {
    id,
    authorId,
    authorName: text(r.authorName, 40) || "—",
    title,
    description: text(r.description, LIMITS.description),
    kind,
    platform,
    genres,
    video,
    status,
    reason: text(r.reason, LIMITS.reason),
    createdAt: ISO(r.createdAt) ? (r.createdAt as string) : new Date(0).toISOString(),
    reviewedAt: ISO(r.reviewedAt) ? (r.reviewedAt as string) : null,
    seenAt: ISO(r.seenAt) ? (r.seenAt as string) : null,
  };
}

/** All submissions in one author document (`{ items: { [id]: … } }`), newest first. */
export function parseAuthorDoc(data: unknown, authorId: string): Submission[] {
  const items = (data as { items?: unknown } | undefined)?.items;
  if (!items || typeof items !== "object") return [];
  return Object.entries(items as Record<string, unknown>)
    .map(([id, raw]) => parseSubmission(raw, id, authorId))
    .filter((s): s is Submission => Boolean(s))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** A decision the author hasn't acknowledged yet. */
export function isUnseenDecision(s: Submission): boolean {
  return s.status !== "pending" && Boolean(s.reviewedAt) && (!s.seenAt || s.seenAt < (s.reviewedAt ?? ""));
}

export function newSubmissionId(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return "v" + Date.now().toString(36) + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
}

export function genreCategories(genres: readonly string[]): string[] {
  return [...new Set(GENRES.filter((g) => genres.includes(g.slug)).flatMap((g) => [...g.categories]))];
}

/** Firebase Storage download links — the only external file host an uploaded video may point at. */
export function isStorageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "firebasestorage.googleapis.com" && url.length <= 600;
  } catch {
    return false;
  }
}

/** Where an uploaded video is served from: Firebase Storage, or the artifact's asset store. */
export const assetUrl = (video: { assetId: string; url?: string }) => video.url ?? `/_blob/${video.assetId}`;

export const DB_RULES = [
  { path: "submissions", read: "admin", write: "admin" },
  { path: "submissions/{self}", read: "interact", write: "interact" },
  { path: "published", read: "view", write: "owner" },
] as const;
