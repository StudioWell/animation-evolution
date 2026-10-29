import { PageHeader } from "@/components/layout/PageHeader";
import { LibraryExplorer } from "@/components/library/LibraryExplorer";
import { parseSearchQuery } from "@/lib/search/params";
import { facetCounts, searchResources } from "@/lib/search/engine";
import { toSearchParams } from "@/lib/search/query-string";
import { getLibrary } from "@/lib/sources/library";
import { liveSearchEnabled } from "@/lib/sources/registry";
import type { LibraryScope } from "@/lib/types";

/** Server-rendered first page; the client explorer takes over for interaction. */
export async function LibraryPage({
  kind,
  searchParams,
}: {
  kind: LibraryScope;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const parsed = parseSearchQuery(kind, searchParams);
  const query = parsed.ok ? { ...parsed.query, page: 1 } : null;
  const library = await getLibrary();
  const records = kind === "all" ? library : library.filter((r) => r.kind === kind);
  const initialPage = query ? searchResources(library, query) : { items: [], total: 0, page: 1, pageSize: 12, hasMore: false };
  // Counts describe the whole library section, so every filter shows how much it holds.
  const counts = facetCounts(records);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <PageHeader title={`lib.${kind}.title`} intro={`lib.${kind}.intro`} />
      {query && (
        <LibraryExplorer
          // Remount when navigation (not typing) changes the query, e.g. a category link.
          key={toSearchParams(query).toString()}
          kind={kind}
          initialQuery={query}
          initialPage={initialPage}
          liveEnabled={liveSearchEnabled()}
          counts={counts}
        />
      )}
    </div>
  );
}
