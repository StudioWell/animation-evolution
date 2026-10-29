import { getGroup } from "@/lib/config/categories";
import { editorialCompare } from "@/lib/search/engine";
import type { Resource } from "@/lib/types";

/** Pure selectors for the homepage rows (kept separate so they're testable). */

const visible = (r: Resource) => r.availability !== "unavailable";

export function byGroup(resources: Resource[], groupSlug: string, limit = 10): Resource[] {
  const group = getGroup(groupSlug);
  if (!group) return [];
  const slugs = new Set(group.categories.map((c) => c.slug));
  return resources
    .filter((r) => visible(r) && r.categories.some((c) => slugs.has(c)))
    .sort(editorialCompare)
    .slice(0, limit);
}

export function featured(resources: Resource[], limit = 8): Resource[] {
  return resources
    .filter((r) => visible(r) && (r.featured ?? 0) > 0)
    .sort(editorialCompare)
    .slice(0, limit);
}

const STUDIED_MEDIA = new Set(["game", "anime", "film", "animation"]);

/**
 * Breakdowns of games, anime and films: ranked by real view counts when the
 * source reports them; otherwise by editorial weight — and the UI says which.
 */
export function trendingStudies(
  resources: Resource[],
  limit = 10,
  alreadyShown: ReadonlySet<string> = new Set(),
): { items: Resource[]; rankedByViews: boolean } {
  const studies = resources.filter(
    (r) => visible(r) && r.contentType === "breakdown" && r.media.some((m) => STUDIED_MEDIA.has(m)) && !alreadyShown.has(r.id),
  );
  const withViews = studies.filter((r) => r.viewCount != null);
  if (withViews.length >= Math.min(4, studies.length) && withViews.length > 0) {
    return {
      items: [...withViews].sort((a, b) => (b.viewCount ?? -1) - (a.viewCount ?? -1)).slice(0, limit),
      rankedByViews: true,
    };
  }
  return { items: [...studies].sort(editorialCompare).slice(0, limit), rankedByViews: false };
}

export function recentlyAdded(resources: Resource[], limit = 10): Resource[] {
  const time = (iso: string | null) => (iso ? Date.parse(iso) : 0);
  return resources
    .filter(visible)
    .sort((a, b) => time(b.addedAt) - time(a.addedAt) || (b.featured ?? 0) - (a.featured ?? 0) || time(b.publishedAt) - time(a.publishedAt))
    .slice(0, limit);
}
