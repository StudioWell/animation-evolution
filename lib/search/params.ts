import { z } from "zod";
import { isKnownCategory, isKnownGroup } from "@/lib/config/categories";
import { SOURCE_IDS } from "@/lib/config/sources";
import { MAX_PAGE, MAX_QUERY_LENGTH, PAGE_SIZE } from "@/lib/search/query-string";
import type {
  ContentType,
  Difficulty,
  DurationBucket,
  LibraryScope,
  Medium,
  Movement,
  SearchQuery,
  Software,
  SortOrder,
  SourceId,
  Technique,
} from "@/lib/types";

/**
 * Server-side validation of search input (API routes and page searchParams).
 * Strict mode rejects anything unexpected; lenient mode (used for page URLs that
 * people may hand-edit or bookmarked before a filter changed) drops invalid
 * values and falls back to defaults.
 */

const SORTS = ["relevance", "added", "newest", "popular"] as const satisfies readonly SortOrder[];
const DURATIONS = ["any", "short", "medium", "long"] as const satisfies readonly DurationBucket[];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const satisfies readonly Difficulty[];
const CONTENT_TYPES = ["reference", "tutorial", "breakdown", "mocap"] as const satisfies readonly ContentType[];
const MEDIA = ["game", "anime", "film", "animation", "live-action"] as const satisfies readonly Medium[];
const TECHNIQUES = ["combat", "body-mechanics", "physics", "locomotion", "acting", "cinematics"] as const satisfies readonly Technique[];
const MOVEMENTS = ["walking", "running", "jumping", "falling", "attacking", "blocking", "dodging"] as const satisfies readonly Movement[];
const SOFTWARE = ["blender", "roblox-studio", "maya", "cinema-4d", "3ds-max", "unreal-engine", "unity", "any"] as const satisfies readonly Software[];

export const OPTIONS = { SORTS, DURATIONS, DIFFICULTIES, CONTENT_TYPES, MEDIA, TECHNIQUES, MOVEMENTS, SOFTWARE } as const;

const slug = z.string().regex(/^[a-z0-9-]{1,48}$/);
const csv = z
  .string()
  .max(600)
  .transform((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  )
  .pipe(z.array(slug).max(30));

const schema = z.object({
  q: z
    .string()
    .max(MAX_QUERY_LENGTH)
    // Drop control characters; the query is only ever used as plain text.
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim())
    .optional(),
  cat: csv.optional(),
  group: slug.optional(),
  sort: z.enum(SORTS).optional(),
  dur: z.enum(DURATIONS).optional(),
  type: csv.optional(),
  media: csv.optional(),
  tech: csv.optional(),
  move: csv.optional(),
  sw: csv.optional(),
  level: csv.optional(),
  by: csv.optional(),
  src: csv.optional(),
  page: z.coerce.number().int().min(1).max(MAX_PAGE).optional(),
});

export type ParseResult = { ok: true; query: SearchQuery } | { ok: false; error: string };

type RawParams = Record<string, string | string[] | undefined>;

function firstValues(input: URLSearchParams | RawParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (input instanceof URLSearchParams) {
    for (const key of input.keys()) {
      const value = input.get(key);
      if (value !== null && !(key in out)) out[key] = value;
    }
  } else {
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") out[key] = value;
      else if (Array.isArray(value) && typeof value[0] === "string") out[key] = value[0];
    }
  }
  return out;
}

function pick<T extends string>(values: string[] | undefined, allowed: readonly T[], strict: boolean): T[] | null {
  if (!values) return [];
  const valid = values.filter((v): v is T => (allowed as readonly string[]).includes(v));
  if (strict && valid.length !== values.length) return null;
  return [...new Set(valid)];
}

export function parseSearchQuery(
  kind: LibraryScope,
  input: URLSearchParams | RawParams,
  { strict = false }: { strict?: boolean } = {},
): ParseResult {
  const raw = firstValues(input);
  let data: z.infer<typeof schema>;

  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    data = parsed.data;
  } else if (strict) {
    const field = parsed.error.issues[0]?.path.join(".") || "query";
    return { ok: false, error: `Invalid value for "${field}".` };
  } else {
    // Lenient: validate each field on its own and keep the ones that pass.
    data = {};
    const shape = schema.shape;
    for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
      if (raw[key] === undefined) continue;
      const single = shape[key].safeParse(raw[key]);
      if (single.success) (data as Record<string, unknown>)[key] = single.data;
    }
  }

  const categories = (data.cat ?? []).filter((c) => isKnownCategory(c));
  if (strict && categories.length !== (data.cat ?? []).length) return { ok: false, error: 'Unknown value in "cat".' };

  let group: string | null = null;
  if (data.group) {
    if (isKnownGroup(data.group)) group = data.group;
    else if (strict) return { ok: false, error: 'Unknown value in "group".' };
  }

  const sources = pick<SourceId>(data.src, SOURCE_IDS, strict);
  const types = pick<ContentType>(data.type, CONTENT_TYPES, strict);
  const media = pick<Medium>(data.media, MEDIA, strict);
  const techniques = pick<Technique>(data.tech, TECHNIQUES, strict);
  const movements = pick<Movement>(data.move, MOVEMENTS, strict);
  const software = pick<Software>(data.sw, SOFTWARE, strict);
  const levels = pick<Difficulty>(data.level, DIFFICULTIES, strict);
  if (!sources || !types || !media || !techniques || !movements || !software || !levels) {
    return { ok: false, error: "Unknown filter value." };
  }

  return {
    ok: true,
    query: {
      kind,
      q: data.q ?? "",
      categories: [...new Set(categories)],
      group,
      sort: data.sort ?? "relevance",
      duration: data.dur ?? "any",
      types,
      media,
      techniques,
      movements,
      software,
      levels,
      creators: [...new Set(data.by ?? [])],
      sources,
      page: data.page ?? 1,
      pageSize: PAGE_SIZE,
    },
  };
}
