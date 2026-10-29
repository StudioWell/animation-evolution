import type { LibraryScope, SearchQuery } from "@/lib/types";

/**
 * Serialise search state to/from URL query strings. Safe to import on the client.
 * Validation of untrusted input lives in lib/search/params.ts (server).
 *
 *   q      text            group  category group     cat    categories
 *   type   content types   media  footage source     tech   techniques
 *   move   movements       sw     software           level  skill levels
 *   by     creators        dur    length             sort   order
 */

export const PAGE_SIZE = 12;
export const MAX_PAGE = 50;
export const MAX_QUERY_LENGTH = 120;

export function defaultQuery(kind: LibraryScope): SearchQuery {
  return {
    kind,
    q: "",
    categories: [],
    group: null,
    sort: "relevance",
    duration: "any",
    types: [],
    media: [],
    techniques: [],
    movements: [],
    software: [],
    levels: [],
    creators: [],
    sources: [],
    page: 1,
    pageSize: PAGE_SIZE,
  };
}

/** Only non-default values are written, keeping URLs short and shareable. */
export function toSearchParams(query: SearchQuery, { includePage = false } = {}): URLSearchParams {
  const params = new URLSearchParams();
  const q = query.q.trim();
  if (q) params.set("q", q);
  if (query.group) params.set("group", query.group);
  if (query.categories.length) params.set("cat", query.categories.join(","));
  if (query.types.length) params.set("type", query.types.join(","));
  if (query.media.length) params.set("media", query.media.join(","));
  if (query.techniques.length) params.set("tech", query.techniques.join(","));
  if (query.movements.length) params.set("move", query.movements.join(","));
  if (query.software.length) params.set("sw", query.software.join(","));
  if (query.levels.length) params.set("level", query.levels.join(","));
  if (query.creators.length) params.set("by", query.creators.join(","));
  if (query.sources.length) params.set("src", query.sources.join(","));
  if (query.duration !== "any") params.set("dur", query.duration);
  if (query.sort !== "relevance") params.set("sort", query.sort);
  if (includePage && query.page > 1) params.set("page", String(query.page));
  return params;
}

export function libraryPath(kind: LibraryScope): string {
  return kind === "reference" ? "/references" : kind === "tutorial" ? "/tutorials" : "/library";
}

export function libraryHref(kind: LibraryScope, partial: Partial<SearchQuery> = {}): string {
  const params = toSearchParams({ ...defaultQuery(kind), ...partial });
  const qs = params.toString();
  return qs ? `${libraryPath(kind)}?${qs}` : libraryPath(kind);
}

export function apiSearchPath(kind: LibraryScope): string {
  return kind === "reference" ? "/api/references/search" : kind === "tutorial" ? "/api/tutorials/search" : "/api/library/search";
}

/** Details page of a record (references and tutorials keep their own URLs). */
export function resourcePath(resource: { kind: "reference" | "tutorial"; id: string }): string {
  return `${resource.kind === "reference" ? "/references" : "/tutorials"}/${resource.id}`;
}

export function activeFilterCount(query: SearchQuery): number {
  return (
    query.categories.length +
    (query.group !== null ? 1 : 0) +
    (query.duration !== "any" ? 1 : 0) +
    query.types.length +
    query.media.length +
    query.techniques.length +
    query.movements.length +
    query.software.length +
    query.levels.length +
    query.creators.length +
    query.sources.length
  );
}

export function hasActiveFilters(query: SearchQuery): boolean {
  return activeFilterCount(query) > 0;
}
