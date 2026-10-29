import { isKnownCategory } from "@/lib/config/categories";
import { OPTIONS } from "@/lib/search/params";
import { REFERENCES } from "@/lib/data/references";
import { TUTORIALS } from "@/lib/data/tutorials";
import { THIRD_SAKUGA, THIRD_YOUTUBE } from "@/lib/data/collection-3";
import { FOURTH_PASS } from "@/lib/data/collection-4";
import { isAllowedSourceUrl, isAllowedThumbnailUrl } from "@/lib/security/url";
import type { Resource } from "@/lib/types";

/**
 * Validate every curated record once at startup. A record with a URL outside
 * the source allowlist, an unknown category or a duplicate id is a bug in the
 * data, so it fails loudly in development/tests and is dropped in production.
 */
const { CONTENT_TYPES, MEDIA, SOFTWARE } = OPTIONS as {
  CONTENT_TYPES: readonly string[];
  MEDIA: readonly string[];
  SOFTWARE: readonly string[];
};

export function validateRecord(resource: Resource): string[] {
  const problems: string[] = [];
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(resource.id)) problems.push("id is not URL-safe");
  if (!resource.title.trim()) problems.push("missing title");
  if (!isAllowedSourceUrl(resource.url, resource.source)) problems.push(`url not allowed for ${resource.source}`);
  if (resource.thumbnail && !isAllowedThumbnailUrl(resource.thumbnail.url)) problems.push("thumbnail host not allowed");
  for (const slug of resource.categories) {
    if (!isKnownCategory(slug)) problems.push(`unknown category "${slug}"`);
  }
  if (!CONTENT_TYPES.includes(resource.contentType)) problems.push("invalid contentType");
  for (const m of resource.media) if (!MEDIA.includes(m)) problems.push(`invalid medium "${m}"`);
  for (const sw of resource.software) if (!SOFTWARE.includes(sw)) problems.push(`invalid software "${sw}"`);
  if (resource.software.length === 0) problems.push("software must list at least one tool or \"any\"");
  if (resource.categories.length === 0) problems.push("no categories");
  if (resource.durationSeconds != null && (!Number.isInteger(resource.durationSeconds) || resource.durationSeconds <= 0)) {
    problems.push("invalid duration");
  }
  if (resource.publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(resource.publishedAt)) problems.push("publishedAt must be YYYY-MM-DD");
  if (resource.verification === null) problems.push("missing verification");
  return problems;
}

function buildLibrary(records: Resource[]): Resource[] {
  const seen = new Set<string>();
  const valid: Resource[] = [];
  for (const record of records) {
    const problems = validateRecord(record);
    if (seen.has(record.id)) problems.push("duplicate id");
    if (problems.length > 0) {
      const message = `[library] ${record.id}: ${problems.join("; ")}`;
      if (process.env.NODE_ENV !== "production") throw new Error(message);
      console.error(message);
      continue;
    }
    seen.add(record.id);
    valid.push(Object.freeze(record));
  }
  return valid;
}

export const CURATED_LIBRARY: Resource[] = buildLibrary([...REFERENCES, ...TUTORIALS, ...THIRD_YOUTUBE, ...THIRD_SAKUGA, ...FOURTH_PASS]);
