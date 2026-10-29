import "server-only";

import { CURATED_LIBRARY } from "@/lib/data";
import { logEvent } from "@/lib/security/log";
import { isValidYouTubeId } from "@/lib/security/url";
import { fetchVideos, mapVideo, youtubeAdapter, youtubeConfigured } from "@/lib/sources/youtube";
import type { Resource, ResourceKind } from "@/lib/types";

/**
 * The library the site serves: the curated records, optionally refreshed with
 * live metadata (duration, views, availability) from the YouTube Data API.
 * The merged array is cached so the search index (keyed by array identity) is reused.
 */

const REFRESH_MS = 6 * 60 * 60 * 1000;
let cached: { at: number; data: Resource[] } | null = null;
let refreshing: Promise<Resource[]> | null = null;

async function hydrate(base: Resource[]): Promise<Resource[]> {
  const ids = base.map((r) => r.youtubeId).filter(isValidYouTubeId);
  const videos = await fetchVideos(ids);
  return base.map((resource) => {
    if (!resource.youtubeId) return resource;
    const video = videos.get(resource.youtubeId);
    if (!video) return resource;
    if (video === "missing") return { ...resource, availability: "unavailable" as const };
    const live = mapVideo(video, resource.kind);
    if (!live) return resource;
    // Keep editorial fields (description, categories, tags, difficulty); take facts from the API.
    return {
      ...resource,
      title: live.title,
      creator: live.creator ?? resource.creator,
      durationSeconds: live.durationSeconds ?? resource.durationSeconds,
      publishedAt: live.publishedAt ?? resource.publishedAt,
      viewCount: live.viewCount,
      availability: live.availability,
      verification: live.verification,
    };
  });
}

export async function getLibrary(): Promise<Resource[]> {
  if (!youtubeConfigured()) return CURATED_LIBRARY;
  const now = Date.now();
  if (cached && now - cached.at < REFRESH_MS) return cached.data;
  if (!refreshing) {
    refreshing = hydrate(CURATED_LIBRARY)
      .then((data) => {
        cached = { at: Date.now(), data };
        return data;
      })
      .catch((error: unknown) => {
        logEvent("warn", "upstream_error", { source: "youtube", stage: "hydrate", message: String(error) });
        // Serve curated data; retry hydration after a short back-off.
        cached = { at: Date.now() - REFRESH_MS + 5 * 60 * 1000, data: cached?.data ?? CURATED_LIBRARY };
        return cached.data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  // Serve stale data while refreshing, when we have it.
  return cached ? cached.data : refreshing;
}

export async function getLibraryKind(kind: ResourceKind): Promise<Resource[]> {
  const all = await getLibrary();
  return all.filter((r) => r.kind === kind);
}

/** Find a record by id; live YouTube ids (yt-…) not in the library are fetched on demand. */
export async function findResource(kind: ResourceKind, id: string): Promise<Resource | null> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  const library = await getLibrary();
  const local = library.find((r) => r.id === id && r.kind === kind);
  if (local) return local;
  if (id.startsWith("yt-")) {
    return youtubeAdapter.getById ? youtubeAdapter.getById(id.slice(3), kind) : null;
  }
  return null;
}
