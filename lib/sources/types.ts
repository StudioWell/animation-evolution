import type { DurationBucket, LiveSearchPage, Resource, ResourceKind, SortOrder, SourceId } from "@/lib/types";

/**
 * A live source adapter searches an external platform and maps its results into
 * `Resource` records with origin "live". Add a platform by implementing this
 * interface and registering it in lib/sources/registry.ts — the API routes and UI
 * don't need to change.
 */
export interface LiveSearchInput {
  kind: ResourceKind;
  q: string;
  duration: DurationBucket;
  sort: SortOrder;
  pageToken: string | null;
}

export interface LiveSearchAdapter {
  id: SourceId;
  label: string;
  /** True when credentials are present. Never exposes the credentials themselves. */
  isConfigured(): boolean;
  search(input: LiveSearchInput): Promise<LiveSearchPage>;
  /** Fetch one item by its platform id (used for detail pages of live results). */
  getById?(platformId: string, kind: ResourceKind): Promise<Resource | null>;
}
