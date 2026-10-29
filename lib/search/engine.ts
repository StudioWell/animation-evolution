import { ALL_CATEGORIES, getGroup } from "@/lib/config/categories";
import { SOFTWARE_OPTIONS, labelFor } from "@/lib/config/filters";
import { sourceLabel } from "@/lib/config/sources";
import { allCategoryNames, allDescriptions, allFacetNames, allTagNames } from "@/lib/i18n";
import { creatorKey } from "@/lib/format";
import type { DurationBucket, Resource, SearchQuery, SearchResultPage } from "@/lib/types";
import { expandSynonyms, normalize, tokenize } from "@/lib/search/text";

/**
 * In-memory, field-weighted search over library records. Pure and synchronous,
 * so it runs identically on the server (API + SSR) and in tests.
 * For a much larger catalogue, swap this for Postgres full-text search behind the
 * same `searchResources` signature.
 */

interface IndexedResource {
  resource: Resource;
  title: string[];
  tags: string[];
  categories: string[];
  works: string[];
  creator: string[];
  description: string[];
  titleNormalized: string;
  allTokens: Set<string>;
}

const WEIGHTS = { title: 6, works: 5, tags: 4, categories: 4, creator: 3, description: 1.5 } as const;
const SYNONYM_FACTOR = 0.6;
const PREFIX_FACTOR = 0.5;

const categoryText = new Map<string, string>();
// Category names in every language, so a search in Russian, Japanese or Chinese finds the same items.
for (const c of ALL_CATEGORIES) {
  categoryText.set(c.slug, [c.label, ...(c.keywords ?? []), ...allCategoryNames(c.slug)].join(" "));
}

/** Words for a record's facets (content type, footage source, technique, movement, software) in every language. */
function facetText(resource: Resource): string {
  return [
    ...allFacetNames("ctype", resource.contentType),
    ...resource.media.flatMap((m) => allFacetNames("media", m)),
    ...resource.techniques.flatMap((t) => allFacetNames("tech", t)),
    ...resource.movements.flatMap((m) => allFacetNames("move", m)),
    ...resource.software.filter((s) => s !== "any").map((s) => labelFor(SOFTWARE_OPTIONS, s)),
    sourceLabel(resource.source),
  ].join(" ");
}

const indexCache = new WeakMap<readonly Resource[], IndexedResource[]>();

export function buildIndex(resources: readonly Resource[]): IndexedResource[] {
  const cached = indexCache.get(resources);
  if (cached) return cached;
  const index = resources.map((resource) => {
    const catText = resource.categories.map((slug) => categoryText.get(slug) ?? slug).join(" ");
    const entry: IndexedResource = {
      resource,
      title: tokenize(resource.title, { keepStopwords: false }),
      tags: tokenize([...resource.tags, ...resource.tags.flatMap(allTagNames)].join(" ")),
      categories: tokenize(`${catText} ${facetText(resource)}`),
      works: tokenize((resource.works ?? []).join(" ")),
      creator: tokenize(resource.creator ?? ""),
      description: tokenize([resource.description, ...allDescriptions(resource.id)].join(" ")),
      titleNormalized: normalize(resource.title),
      allTokens: new Set<string>(),
    };
    for (const list of [entry.title, entry.tags, entry.categories, entry.works, entry.creator, entry.description]) {
      for (const token of list) entry.allTokens.add(token);
    }
    return entry;
  });
  indexCache.set(resources, index);
  return index;
}

function fieldScore(fieldTokens: string[], token: string, synonyms: string[], allowPrefix: boolean): number {
  let best = 0;
  for (const candidate of fieldTokens) {
    if (candidate === token) return 1;
    if (synonyms.includes(candidate)) best = Math.max(best, SYNONYM_FACTOR);
    else if (allowPrefix && token.length >= 2 && candidate.startsWith(token)) best = Math.max(best, PREFIX_FACTOR);
  }
  return best;
}

/** Score a record against a query. Returns 0 when nothing matches. */
export function scoreEntry(entry: IndexedResource, queryTokens: string[], queryNormalized: string): number {
  if (queryTokens.length === 0) return 0;
  let score = 0;
  let matched = 0;
  queryTokens.forEach((token, i) => {
    const synonyms = expandSynonyms(token);
    const allowPrefix = i === queryTokens.length - 1; // as-you-type on the last word
    let tokenScore = 0;
    tokenScore += WEIGHTS.title * fieldScore(entry.title, token, synonyms, allowPrefix);
    tokenScore += WEIGHTS.tags * fieldScore(entry.tags, token, synonyms, allowPrefix);
    tokenScore += WEIGHTS.categories * fieldScore(entry.categories, token, synonyms, allowPrefix);
    tokenScore += WEIGHTS.works * fieldScore(entry.works, token, synonyms, allowPrefix);
    tokenScore += WEIGHTS.creator * fieldScore(entry.creator, token, synonyms, allowPrefix);
    tokenScore += WEIGHTS.description * fieldScore(entry.description, token, synonyms, allowPrefix);
    if (tokenScore > 0) matched += 1;
    score += tokenScore;
  });
  if (matched === 0) return 0;
  const coverage = matched / queryTokens.length;
  score *= coverage * coverage;
  if (queryNormalized.length > 3 && entry.titleNormalized.includes(queryNormalized)) score += 10;
  return score;
}

export function durationBucketMatches(seconds: number | null, bucket: DurationBucket): boolean {
  if (bucket === "any") return true;
  if (seconds == null) return false; // only filter on real duration data
  if (bucket === "short") return seconds < 4 * 60;
  if (bucket === "medium") return seconds >= 4 * 60 && seconds <= 20 * 60;
  return seconds > 20 * 60;
}

const some = <T,>(selected: readonly T[], values: readonly T[]) => selected.length === 0 || values.some((v) => selected.includes(v));

export function matchesFilters(resource: Resource, query: SearchQuery): boolean {
  if (query.kind !== "all" && resource.kind !== query.kind) return false;
  if (resource.availability === "unavailable") return false;

  if (query.group) {
    const group = getGroup(query.group);
    if (group && !resource.categories.some((slug) => group.categories.some((c) => c.slug === slug))) return false;
  }
  if (!some(query.categories, resource.categories)) return false;
  if (!durationBucketMatches(resource.durationSeconds, query.duration)) return false;
  if (!some(query.sources, [resource.source])) return false;
  if (!some(query.types, [resource.contentType])) return false;
  if (!some(query.media, resource.media)) return false;
  if (!some(query.techniques, resource.techniques)) return false;
  if (!some(query.movements, resource.movements)) return false;
  if (!some(query.software, resource.software)) return false;
  if (query.levels.length > 0 && (!resource.difficulty || !query.levels.includes(resource.difficulty))) return false;
  if (query.creators.length > 0 && (!resource.creator || !query.creators.includes(creatorKey(resource.creator)))) return false;
  return true;
}

function dateValue(iso: string | null | undefined): number {
  if (!iso) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/** Default "editorial" order when there is no text query. */
export function editorialCompare(a: Resource, b: Resource): number {
  return (
    (b.featured ?? 0) - (a.featured ?? 0) ||
    dateValue(b.addedAt) - dateValue(a.addedAt) ||
    dateValue(b.publishedAt) - dateValue(a.publishedAt) ||
    a.title.localeCompare(b.title)
  );
}

export function searchResources(resources: readonly Resource[], query: SearchQuery): SearchResultPage {
  const index = buildIndex(resources);
  const queryTokens = [...new Set(tokenize(query.q))];
  const queryNormalized = normalize(query.q);
  const hasText = queryTokens.length > 0;

  const scored: { resource: Resource; score: number }[] = [];
  for (const entry of index) {
    if (!matchesFilters(entry.resource, query)) continue;
    const score = hasText ? scoreEntry(entry, queryTokens, queryNormalized) : 0;
    if (hasText && score <= 0) continue;
    scored.push({ resource: entry.resource, score: score + (entry.resource.featured ?? 0) * 0.05 });
  }

  scored.sort((a, b) => {
    if (query.sort === "added") {
      const diff = dateValue(b.resource.addedAt) - dateValue(a.resource.addedAt);
      if (diff !== 0 && Number.isFinite(diff)) return diff;
    } else if (query.sort === "popular") {
      const av = a.resource.viewCount ?? -1;
      const bv = b.resource.viewCount ?? -1;
      if (av !== bv) return bv - av;
    } else if (query.sort === "newest") {
      const diff = dateValue(b.resource.publishedAt) - dateValue(a.resource.publishedAt);
      if (diff !== 0 && Number.isFinite(diff)) return diff;
      if (!Number.isFinite(diff)) {
        const aKnown = a.resource.publishedAt ? 1 : 0;
        const bKnown = b.resource.publishedAt ? 1 : 0;
        if (aKnown !== bKnown) return bKnown - aKnown;
      }
    }
    if (hasText && b.score !== a.score) return b.score - a.score;
    return editorialCompare(a.resource, b.resource);
  });

  const total = scored.length;
  const start = (query.page - 1) * query.pageSize;
  const items = scored.slice(start, start + query.pageSize).map((s) => s.resource);
  return { items, total, page: query.page, pageSize: query.pageSize, hasMore: start + items.length < total };
}

/** Related records: shared categories, techniques, works and tags, then text similarity of titles. */
export function relatedResources(target: Resource, pool: readonly Resource[], kind: Resource["kind"], limit = 8): Resource[] {
  const targetTokens = new Set(tokenize(`${target.title} ${target.tags.join(" ")} ${(target.works ?? []).join(" ")}`));
  const targetCategoryText = new Set(tokenize(target.categories.map((slug) => categoryText.get(slug) ?? slug).join(" ")));
  const index = buildIndex(pool);
  const scored = index
    .filter((e) => e.resource.kind === kind && e.resource.id !== target.id && e.resource.availability !== "unavailable")
    .map((e) => {
      const r = e.resource;
      let score = r.categories.filter((c) => target.categories.includes(c)).length * 5;
      score += r.techniques.filter((t) => target.techniques.includes(t)).length * 2;
      score += r.movements.filter((m) => target.movements.includes(m)).length * 2;
      score += (r.works ?? []).filter((w) => target.works?.includes(w)).length * 6;
      for (const token of e.allTokens) {
        if (targetTokens.has(token)) score += 1.5;
        else if (targetCategoryText.has(token)) score += 1;
      }
      return { resource: r, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || editorialCompare(a.resource, b.resource));
  return scored.slice(0, limit).map((s) => s.resource);
}

/** How many visible records carry each facet value — drives the counts shown in the filters. */
export function facetCounts(resources: readonly Resource[]) {
  const counts = {
    categories: {} as Record<string, number>,
    groups: {} as Record<string, number>,
    types: {} as Record<string, number>,
    media: {} as Record<string, number>,
    techniques: {} as Record<string, number>,
    movements: {} as Record<string, number>,
    software: {} as Record<string, number>,
    levels: {} as Record<string, number>,
    creators: {} as Record<string, { name: string; count: number }>,
    total: 0,
  };
  const bump = (map: Record<string, number>, key: string) => (map[key] = (map[key] ?? 0) + 1);
  for (const r of resources) {
    if (r.availability === "unavailable") continue;
    counts.total += 1;
    r.categories.forEach((c) => bump(counts.categories, c));
    const groups = new Set(r.categories.map((c) => ALL_CATEGORIES.find((x) => x.slug === c)?.group).filter(Boolean) as string[]);
    groups.forEach((g) => bump(counts.groups, g));
    bump(counts.types, r.contentType);
    r.media.forEach((m) => bump(counts.media, m));
    r.techniques.forEach((t) => bump(counts.techniques, t));
    r.movements.forEach((m) => bump(counts.movements, m));
    r.software.forEach((s) => bump(counts.software, s));
    if (r.difficulty) bump(counts.levels, r.difficulty);
    if (r.creator) {
      const key = creatorKey(r.creator);
      counts.creators[key] = { name: r.creator, count: (counts.creators[key]?.count ?? 0) + 1 };
    }
  }
  return counts;
}

export type FacetCounts = ReturnType<typeof facetCounts>;
