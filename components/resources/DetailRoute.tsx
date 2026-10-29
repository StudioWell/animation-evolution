import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetail } from "@/components/resources/ResourceDetail";
import { relatedResources } from "@/lib/search/engine";
import { findResource, getLibrary } from "@/lib/sources/library";
import type { ResourceKind } from "@/lib/types";

/** Shared server logic for /references/[id] and /tutorials/[id]. */
export async function renderDetail(kind: ResourceKind, id: string) {
  const resource = await findResource(kind, id);
  if (!resource) notFound();
  const library = await getLibrary();
  return (
    <ResourceDetail
      resource={resource}
      relatedReferences={relatedResources(resource, library, "reference", 8)}
      relatedTutorials={relatedResources(resource, library, "tutorial", 8)}
    />
  );
}

export async function detailMetadata(kind: ResourceKind, id: string): Promise<Metadata> {
  const resource = await findResource(kind, id);
  if (!resource) return { title: "Not found" };
  return {
    title: resource.title,
    description: resource.description,
    // Live results are not curated content; keep them out of search engines.
    robots: resource.origin === "live" ? { index: false } : undefined,
  };
}
