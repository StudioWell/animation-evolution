import "server-only";

import { parseIsoDuration } from "@/lib/format";
import { InFlight, TtlCache } from "@/lib/security/cache";
import { OverloadedError, upstreamPool } from "@/lib/security/concurrency";
import { logEvent } from "@/lib/security/log";
import { OutboundError, safeFetchJson } from "@/lib/security/safe-fetch";
import { cleanText, summarize } from "@/lib/security/sanitize";
import { isValidYouTubeId, youtubeThumbnail, youtubeWatchUrl } from "@/lib/security/url";
import { ALL_CATEGORIES, deriveFacets } from "@/lib/config/categories";
import { tokenize } from "@/lib/search/text";
import type { LiveSearchAdapter, LiveSearchInput } from "@/lib/sources/types";
import type { Availability, LiveSearchPage, Resource, ResourceKind, Software } from "@/lib/types";

/**
 * YouTube Data API v3 adapter (server-only; the key never reaches the browser).
 * Docs: https://developers.google.com/youtube/v3/docs
 *
 * Quota: search.list = 100 units, videos.list = 1 unit (per 50 ids).
 * The default project quota is 10,000 units/day, so results are cached and a
 * local daily budget stops calls before the quota is exhausted.
 */

const API = "https://www.googleapis.com/youtube/v3";
const PAGE_TOKEN = /^[A-Za-z0-9_-]{1,64}$/;

function apiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return key ? key : null;
}

export function youtubeConfigured(): boolean {
  return apiKey() !== null;
}

// ---- Quota budget (per instance, resets daily at 00:00 Pacific like YouTube's) ----
const budget = { day: "", used: 0 };

function pacificDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

function spend(units: number): boolean {
  const limit = Number(process.env.YOUTUBE_DAILY_QUOTA_BUDGET ?? 8000);
  const today = pacificDay();
  if (budget.day !== today) {
    budget.day = today;
    budget.used = 0;
  }
  if (budget.used + units > limit) return false;
  budget.used += units;
  return true;
}

// ---- Raw API types (only the fields we read) ----
interface ApiVideo {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    tags?: string[];
  };
  contentDetails?: { duration?: string; contentRating?: { ytRating?: string } };
  statistics?: { viewCount?: string };
  status?: { privacyStatus?: string; uploadStatus?: string };
}

interface ApiList<T> {
  items?: T[];
  nextPageToken?: string;
}

interface ApiSearchItem {
  id?: { videoId?: string };
}

class QuotaError extends Error {}

async function call<T>(endpoint: "search" | "videos", params: Record<string, string>, units: number): Promise<T> {
  const key = apiKey();
  if (!key) throw new QuotaError("not-configured");
  if (!spend(units)) {
    logEvent("warn", "quota_exhausted", { source: "youtube" });
    throw new QuotaError("quota");
  }
  const url = new URL(`${API}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key);
  return upstreamPool.run(() => safeFetchJson<T>(url.toString(), { timeoutMs: 6000 }));
}

// ---- Classification of live results ----
/**
 * Lightweight keyword classification for live results, so cards can show a
 * category. These are derived from the video's own title/tags, never invented.
 */
const categoryTokens = ALL_CATEGORIES.map((c) => ({ slug: c.slug, tokens: new Set(tokenize([c.label, ...(c.keywords ?? [])].join(" "))) }));

export function inferCategories(_kind: ResourceKind, text: string, limit = 2): string[] {
  const words = tokenize(text);
  const scored = categoryTokens
    .map(({ slug, tokens }) => ({ slug, score: words.filter((w) => tokens.has(w)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.slug);
}

const SOFTWARE_PATTERNS: [Software, RegExp][] = [
  ["blender", /\bblender\b/i],
  ["roblox-studio", /\broblox\b/i],
  ["maya", /\bmaya\b/i],
  ["cinema-4d", /\b(cinema ?4d|c4d)\b/i],
  ["3ds-max", /\b3ds ?max\b/i],
  ["unreal-engine", /\b(unreal|ue4|ue5)\b/i],
  ["unity", /\bunity\b/i],
];

export function inferSoftware(text: string): Software[] {
  return SOFTWARE_PATTERNS.filter(([, re]) => re.test(text)).map(([s]) => s);
}

// ---- Mapping ----
export function availabilityOf(video: ApiVideo): Availability {
  const status = video.status;
  if (!status || status.privacyStatus !== "public") return "unavailable";
  if (status.uploadStatus && status.uploadStatus !== "processed") return "unavailable";
  if (video.contentDetails?.contentRating?.ytRating === "ytAgeRestricted") return "restricted";
  return "available";
}

export function mapVideo(video: ApiVideo, kind: ResourceKind, now = new Date()): Resource | null {
  const id = video.id;
  if (!isValidYouTubeId(id)) return null;
  const title = cleanText(video.snippet?.title, 160);
  if (!title) return null;
  const tags = (video.snippet?.tags ?? [])
    .slice(0, 6)
    .map((t) => cleanText(t, 32).toLowerCase())
    .filter(Boolean);
  const text = `${title} ${tags.join(" ")}`;
  const views = Number(video.statistics?.viewCount);
  const published = video.snippet?.publishedAt?.slice(0, 10) ?? null;
  const categories = inferCategories(kind, text);
  const software = inferSoftware(text);

  return {
    id: `yt-${id}`,
    kind,
    title,
    description: summarize(video.snippet?.description) || "No description provided by the channel.",
    url: youtubeWatchUrl(id),
    source: "youtube",
    creator: cleanText(video.snippet?.channelTitle, 80) || null,
    format: "video",
    durationSeconds: parseIsoDuration(video.contentDetails?.duration),
    publishedAt: published && /^\d{4}-\d{2}-\d{2}$/.test(published) ? published : null,
    addedAt: now.toISOString().slice(0, 10),
    thumbnail: youtubeThumbnail(id),
    categories,
    ...deriveFacets(categories),
    contentType: kind === "tutorial" ? "tutorial" : "reference",
    media: [],
    tags: tags.slice(0, 4),
    youtubeId: id,
    viewCount: Number.isFinite(views) ? views : null,
    availability: availabilityOf(video),
    origin: "live",
    verification: { method: "youtube-data-api", checkedAt: now.toISOString().slice(0, 10) },
    difficulty: null,
    software: software.length > 0 ? software : ["any"],
  };
}

// ---- Video metadata (hydration of curated items + detail pages) ----
const videoCache = new TtlCache<ApiVideo | "missing">(5000, 6 * 60 * 60 * 1000);
const inflight = new InFlight<Map<string, ApiVideo | "missing">>();

export async function fetchVideos(ids: string[]): Promise<Map<string, ApiVideo | "missing">> {
  const valid = [...new Set(ids.filter(isValidYouTubeId))];
  const result = new Map<string, ApiVideo | "missing">();
  const toFetch: string[] = [];
  for (const id of valid) {
    const hit = videoCache.get(id);
    if (hit) result.set(id, hit);
    else toFetch.push(id);
  }
  for (let i = 0; i < toFetch.length; i += 50) {
    const chunk = toFetch.slice(i, i + 50);
    const fetched = await inflight.run(chunk.join(","), async () => {
      const data = await call<ApiList<ApiVideo>>(
        "videos",
        { part: "snippet,contentDetails,statistics,status", id: chunk.join(","), maxResults: "50" },
        1,
      );
      const map = new Map<string, ApiVideo | "missing">();
      for (const item of data.items ?? []) if (item.id) map.set(item.id, item);
      // Ids the API does not return are deleted or private.
      for (const id of chunk) if (!map.has(id)) map.set(id, "missing");
      return map;
    });
    for (const [id, value] of fetched) {
      videoCache.set(id, value);
      result.set(id, value);
    }
  }
  return result;
}

// ---- Live search ----
const searchCache = new TtlCache<LiveSearchPage>(500, 30 * 60 * 1000);
const searchInflight = new InFlight<LiveSearchPage>();

function focusQuery(kind: ResourceKind, q: string): string {
  const lower = q.toLowerCase();
  if (kind === "tutorial") {
    return /\b(tutorial|how to|guide|course|lesson)\b/.test(lower) ? q : `${q} animation tutorial`;
  }
  return /\b(reference|slow motion|footage)\b/.test(lower) ? q : `${q} reference`;
}

function errorKind(error: unknown): LiveSearchPage["error"] {
  if (error instanceof QuotaError) return error.message === "not-configured" ? "not-configured" : "quota";
  if (error instanceof OverloadedError) return "upstream";
  if (error instanceof OutboundError) {
    if (error.kind === "timeout") return "timeout";
    if (error.status === 403) return "quota";
  }
  return "upstream";
}

async function searchUncached(input: LiveSearchInput): Promise<LiveSearchPage> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "video",
    maxResults: "12",
    safeSearch: "strict",
    q: focusQuery(input.kind, input.q),
    order: input.sort === "popular" ? "viewCount" : input.sort === "newest" ? "date" : "relevance",
    videoDuration: input.duration,
  };
  const lang = process.env.YOUTUBE_RELEVANCE_LANGUAGE?.trim();
  if (lang && /^[a-z]{2}$/.test(lang)) params.relevanceLanguage = lang;
  if (input.pageToken) params.pageToken = input.pageToken;

  const search = await call<ApiList<ApiSearchItem>>("search", params, 100);
  const ids = (search.items ?? []).map((item) => item.id?.videoId).filter(isValidYouTubeId);
  const videos = await fetchVideos(ids);
  const items: Resource[] = [];
  for (const id of ids) {
    const video = videos.get(id);
    if (!video || video === "missing") continue;
    const mapped = mapVideo(video, input.kind);
    // Never present unavailable or age-restricted videos as normal results.
    if (mapped && mapped.availability === "available") items.push(mapped);
  }
  const next = search.nextPageToken;
  return { enabled: true, items, nextPageToken: next && PAGE_TOKEN.test(next) ? next : null, error: null };
}

export const youtubeAdapter: LiveSearchAdapter = {
  id: "youtube",
  label: "YouTube",
  isConfigured: youtubeConfigured,

  async search(input) {
    if (!youtubeConfigured()) return { enabled: false, items: [], nextPageToken: null, error: "not-configured" };
    if (input.pageToken && !PAGE_TOKEN.test(input.pageToken)) {
      return { enabled: true, items: [], nextPageToken: null, error: "upstream" };
    }
    const key = JSON.stringify([input.kind, input.q.toLowerCase(), input.duration, input.sort, input.pageToken]);
    const cached = searchCache.get(key);
    if (cached) return cached;
    try {
      const page = await searchInflight.run(key, () => searchUncached(input));
      searchCache.set(key, page);
      return page;
    } catch (error) {
      const kind = errorKind(error);
      logEvent(kind === "timeout" ? "warn" : "error", kind === "timeout" ? "upstream_timeout" : "upstream_error", {
        source: "youtube",
        reason: kind,
      });
      return { enabled: true, items: [], nextPageToken: null, error: kind };
    }
  },

  async getById(videoId, kind) {
    if (!youtubeConfigured() || !isValidYouTubeId(videoId)) return null;
    try {
      const videos = await fetchVideos([videoId]);
      const video = videos.get(videoId);
      if (!video || video === "missing") return null;
      return mapVideo(video, kind);
    } catch (error) {
      logEvent("warn", "upstream_error", { source: "youtube", reason: errorKind(error) });
      return null;
    }
  },
};
