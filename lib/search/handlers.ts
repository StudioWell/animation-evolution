import "server-only";

import { ApiError, guardedGet, json } from "@/lib/security/api";
import { POLICIES } from "@/lib/security/rate-limit";
import { searchResources } from "@/lib/search/engine";
import { parseSearchQuery } from "@/lib/search/params";
import { parseItemIds, pickResources } from "@/lib/search/items";
import { getLibrary } from "@/lib/sources/library";
import { liveSearchEnabled, primaryLiveAdapter } from "@/lib/sources/registry";
import type { LibraryScope, LiveSearchPage, SearchQuery, SearchResultPage } from "@/lib/types";

/** Library search used by both the API routes and server-rendered pages. */
export async function searchLibrary(query: SearchQuery): Promise<SearchResultPage> {
  const library = await getLibrary();
  return searchResources(library, query);
}

/** Live platform search (YouTube). Only runs when a key is configured and the user asked for it. */
export async function searchLive(query: SearchQuery, pageToken: string | null): Promise<LiveSearchPage> {
  const adapter = primaryLiveAdapter();
  if (!adapter) return { enabled: false, items: [], nextPageToken: null, error: "not-configured" };
  if (!query.q.trim()) return { enabled: true, items: [], nextPageToken: null, error: null };
  return adapter.search({
    kind: query.kind === "all" ? "reference" : query.kind,
    q: query.q,
    duration: query.duration,
    sort: query.sort,
    pageToken,
  });
}

/** Factory for /api/library/search, /api/references/search and /api/tutorials/search. */
export function librarySearchHandler(kind: LibraryScope) {
  return guardedGet(
    { name: `search-${kind}`, clientPolicy: POLICIES.librarySearch, globalPolicy: POLICIES.globalSearch },
    async (_request, url) => {
      const parsed = parseSearchQuery(kind, url.searchParams, { strict: true });
      if (!parsed.ok) throw new ApiError(400, "invalid_query", parsed.error);
      const page = await searchLibrary(parsed.query);
      return json(
        { ...page, live: { enabled: liveSearchEnabled() } },
        // Identical searches can be served from the CDN/edge cache for a minute.
        { headers: { "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
      );
    },
  );
}

/** /api/library/items?ids=a,b — the records a visitor saved to their profile, in their order. */
export const libraryItemsHandler = guardedGet(
  { name: "items", clientPolicy: POLICIES.librarySearch, globalPolicy: POLICIES.globalSearch },
  async (_request, url) => {
    const parsed = parseItemIds(url.searchParams.get("ids"));
    if (!parsed.ok) throw new ApiError(400, "invalid_query", parsed.error);
    const items = pickResources(await getLibrary(), parsed.ids);
    return json({ items }, { headers: { "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } });
  },
);

/** /api/live — explicit, user-triggered YouTube search (costs API quota). */
export const liveSearchHandler = guardedGet(
  { name: "live", clientPolicy: POLICIES.liveSearch, globalPolicy: POLICIES.globalLive },
  async (_request, url) => {
    const kindParam = url.searchParams.get("kind");
    if (kindParam !== "reference" && kindParam !== "tutorial") {
      throw new ApiError(400, "invalid_query", 'Invalid value for "kind".');
    }
    const params = new URLSearchParams(url.searchParams);
    params.delete("kind");
    const pageToken = params.get("pageToken");
    params.delete("pageToken");
    if (pageToken !== null && !/^[A-Za-z0-9_-]{1,64}$/.test(pageToken)) {
      throw new ApiError(400, "invalid_query", 'Invalid value for "pageToken".');
    }
    const parsed = parseSearchQuery(kindParam, params, { strict: true });
    if (!parsed.ok) throw new ApiError(400, "invalid_query", parsed.error);
    if (!parsed.query.q) throw new ApiError(400, "invalid_query", "Enter a search term to search YouTube.");
    const page = await searchLive(parsed.query, pageToken);
    const status = page.error === "quota" ? 503 : 200;
    return json(page, {
      status,
      headers: { "cache-control": page.error ? "no-store" : "public, max-age=0, s-maxage=600, stale-while-revalidate=1800" },
    });
  },
);
