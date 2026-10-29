import type { DurationBucket } from "@/lib/types";

/**
 * Length tags people can type into any search box: "punch combo #short".
 *   #short     up to 3 minutes
 *   #normal    3 to 10 minutes
 *   #long      10 to 30 minutes
 *   #verylong  45 minutes or more
 * The tag works like the Length filter; the rest of the text is searched as usual.
 */
export const DURATION_TAGS = ["short", "normal", "long", "verylong"] as const satisfies readonly DurationBucket[];
export type DurationTag = (typeof DURATION_TAGS)[number];

const TAG = /(^|\s)#(verylong|very-long|very_long|short|normal|long)(?=\s|$)/gi;

function canonical(raw: string): DurationTag {
  const v = raw.toLowerCase().replace(/[-_]/g, "");
  return v as DurationTag;
}

/** The last length tag in the text, if any. */
export function durationTag(q: string): DurationTag | null {
  let found: DurationTag | null = null;
  for (const m of q.matchAll(TAG)) found = canonical(m[2]!);
  return found;
}

/** The text without length tags (what is actually searched for). */
export function stripDurationTags(q: string): string {
  return q.replace(TAG, " ").replace(/\s+/g, " ").trim();
}

/** Upper and lower bounds in seconds for each length. */
export const DURATION_RANGES: Record<Exclude<DurationBucket, "any">, { min: number; max: number }> = {
  short: { min: 0, max: 3 * 60 },
  normal: { min: 3 * 60 + 1, max: 10 * 60 },
  long: { min: 10 * 60 + 1, max: 30 * 60 },
  verylong: { min: 45 * 60, max: Number.POSITIVE_INFINITY },
};
