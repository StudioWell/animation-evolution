import type { Resource } from "@/lib/types";

/** Most ids one request may ask for (a profile's saved list is capped to match). */
export const MAX_ITEM_IDS = 200;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Parse `ids=a,b,c` strictly: known shape, no duplicates, bounded count. */
export function parseItemIds(raw: string | null): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (raw === null || raw === "") return { ok: true, ids: [] };
  const ids = raw.split(",");
  if (ids.length > MAX_ITEM_IDS) return { ok: false, error: `At most ${MAX_ITEM_IDS} ids per request.` };
  if (!ids.every((id) => ID.test(id))) return { ok: false, error: 'Invalid value for "ids".' };
  return { ok: true, ids: [...new Set(ids)] };
}

/** The library records for these ids, in the order asked; unknown ids are skipped. */
export function pickResources(library: readonly Resource[], ids: readonly string[]): Resource[] {
  const byId = new Map(library.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is Resource => Boolean(r));
}
