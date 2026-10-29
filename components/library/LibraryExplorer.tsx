"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  CONTENT_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  DURATION_OPTIONS,
  MEDIA_OPTIONS,
  MOVEMENT_OPTIONS,
  SOFTWARE_OPTIONS,
  SORT_OPTIONS,
  TECHNIQUE_OPTIONS,
} from "@/lib/config/filters";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";
import type { FacetCounts } from "@/lib/search/engine";
import { activeFilterCount, apiSearchPath, defaultQuery, hasActiveFilters, libraryPath, toSearchParams } from "@/lib/search/query-string";
import type { LibraryScope, LiveSearchPage, Resource, SearchQuery, SearchResultPage } from "@/lib/types";
import { FacetNav } from "@/components/library/FacetNav";
import { LiveResults } from "@/components/library/LiveResults";
import { ResultsGrid, SkeletonGrid } from "@/components/library/ResultsGrid";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { useI18n } from "@/components/settings/useI18n";

type Status = "ready" | "loading" | "loading-more" | "error";

interface ApiPage extends SearchResultPage {
  live: { enabled: boolean };
}

const DEBOUNCE_MS = 300;

type ErrorInfo = { key: MessageKey; vars?: Record<string, string | number> };

function errorInfo(status: number, retryAfter: string | null): ErrorInfo {
  if (status === 429) return { key: "lib.error.rate", vars: { seconds: retryAfter ?? "5" } };
  if (status === 400) return { key: "lib.error.bad" };
  if (status >= 500) return { key: "lib.error.server" };
  return { key: "lib.error.generic" };
}

/** Options with translated labels and live counts; values nobody uses here are hidden unless selected. */
function withCounts<T extends string>(
  options: { value: T; label: string; hint?: string }[],
  counts: Record<string, number>,
  selected: readonly T[],
  label: (value: T) => string,
): DropdownOption<T>[] {
  return options
    .filter((o) => (counts[o.value] ?? 0) > 0 || selected.includes(o.value))
    .map((o) => ({ value: o.value, label: label(o.value), count: counts[o.value] ?? 0 }));
}

type MultiKey = "types" | "media" | "techniques" | "movements" | "software" | "levels" | "creators";

export function LibraryExplorer({
  kind,
  initialQuery,
  initialPage,
  liveEnabled,
  counts,
}: {
  kind: LibraryScope;
  initialQuery: SearchQuery;
  initialPage: SearchResultPage;
  liveEnabled: boolean;
  counts: FacetCounts;
}) {
  const { t, plural, list, cat, group: groupName, number } = useI18n();
  const [query, setQuery] = useState<SearchQuery>({ ...initialQuery, page: 1 });
  const [text, setText] = useState(initialQuery.q);
  const [items, setItems] = useState<Resource[]>(initialPage.items);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [status, setStatus] = useState<Status>("ready");
  const [error, setError] = useState<ErrorInfo | null>(null);
  // Small screens fold the filter row behind a "Filters" button.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [live, setLive] = useState<{ status: "idle" | "loading" | "ready"; page: LiveSearchPage | null; items: Resource[] }>({
    status: "idle",
    page: null,
    items: [],
  });

  const controller = useRef<AbortController | null>(null);
  const lastKey = useRef(toSearchParams(initialQuery).toString());
  // Latest query for the debounce timer (updated only in event handlers, never during render).
  const queryRef = useRef<SearchQuery>({ ...initialQuery, page: 1 });

  const softwareLabel = useCallback(
    (value: string) => (value === "any" ? t("sw.any") : (SOFTWARE_OPTIONS.find((o) => o.value === value)?.label ?? value)),
    [t],
  );

  const options = useMemo(
    () => ({
      sort: SORT_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`sort.${o.value}`),
        hint: o.hint ? t(`sort.${o.value}.hint` as MessageKey) : undefined,
      })),
      duration: DURATION_OPTIONS.map((o) => ({ value: o.value, label: t(`dur.${o.value}`) })),
      types: withCounts(CONTENT_TYPE_OPTIONS, counts.types, query.types, (v) => t(`ctype.${v}`)),
      media: withCounts(MEDIA_OPTIONS, counts.media, query.media, (v) => t(`media.${v}`)),
      techniques: withCounts(TECHNIQUE_OPTIONS, counts.techniques, query.techniques, (v) => t(`tech.${v}`)),
      movements: withCounts(MOVEMENT_OPTIONS, counts.movements, query.movements, (v) => t(`move.${v}`)),
      software: withCounts(SOFTWARE_OPTIONS, counts.software, query.software, softwareLabel),
      levels: withCounts(DIFFICULTY_OPTIONS, counts.levels, query.levels, (v) => t(`level.${v}`)),
      creators: Object.entries(counts.creators)
        .sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name))
        .map(([value, c]) => ({ value, label: c.name, count: c.count })),
    }),
    [t, counts, query.types, query.media, query.techniques, query.movements, query.software, query.levels, softwareLabel],
  );

  const load = useCallback(
    async (next: SearchQuery, mode: "replace" | "append") => {
      controller.current?.abort();
      const ac = new AbortController();
      controller.current = ac;
      setStatus(mode === "append" ? "loading-more" : "loading");
      setError(null);
      const params = toSearchParams(next, { includePage: true });
      try {
        const response = await fetch(`${apiSearchPath(kind)}?${params.toString()}`, {
          signal: ac.signal,
          headers: { accept: "application/json" },
        });
        if (!response.ok) {
          setError(errorInfo(response.status, response.headers.get("retry-after")));
          setStatus("error");
          return;
        }
        const data = (await response.json()) as ApiPage;
        setItems((current) => (mode === "append" ? [...current, ...data.items] : data.items));
        setTotal(data.total);
        setHasMore(data.hasMore);
        setStatus("ready");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError({ key: "lib.error.offline" });
        setStatus("error");
      }
    },
    [kind],
  );

  /**
   * Apply a new query: keep it in state, mirror it in the URL (replaceState, so no
   * server round trip and no history spam) and fetch the first page.
   */
  const applyQuery = useCallback(
    (next: SearchQuery) => {
      const query1 = { ...next, page: 1 };
      queryRef.current = query1;
      setQuery(query1);
      const key = toSearchParams(query1).toString();
      if (key === lastKey.current) return;
      lastKey.current = key;
      window.history.replaceState(window.history.state, "", key ? `${libraryPath(kind)}?${key}` : libraryPath(kind));
      setLive({ status: "idle", page: null, items: [] });
      void load(query1, "replace");
    },
    [kind, load],
  );

  // Debounce typing into a search.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const q = text.trim();
      if (q !== queryRef.current.q) applyQuery({ ...queryRef.current, q });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [text, applyQuery]);

  useEffect(() => () => controller.current?.abort(), []);

  const update = (patch: Partial<SearchQuery>) => applyQuery({ ...query, ...patch });

  const loadMore = () => {
    const next = { ...query, page: query.page + 1 };
    queryRef.current = next;
    setQuery(next);
    void load(next, "append");
  };

  const retry = () => void load({ ...query, page: 1 }, "replace");

  const clearAll = () => {
    setText("");
    applyQuery(defaultQuery(kind));
  };

  const clearFilters = () => applyQuery({ ...defaultQuery(kind), q: query.q, sort: query.sort });

  const liveKind = kind === "all" ? "reference" : kind;
  const runLive = async (pageToken: string | null) => {
    setLive((l) => ({ ...l, status: "loading" }));
    const params = toSearchParams({ ...query, page: 1 });
    params.set("kind", liveKind);
    if (pageToken) params.set("pageToken", pageToken);
    try {
      const response = await fetch(`/api/live?${params.toString()}`, { headers: { accept: "application/json" } });
      if (response.status === 429) {
        setLive((l) => ({ ...l, status: "ready", page: { enabled: true, items: [], nextPageToken: null, error: "quota" } }));
        return;
      }
      const data = (await response.json()) as LiveSearchPage;
      setLive((l) => ({ status: "ready", page: data, items: pageToken ? [...l.items, ...data.items] : data.items }));
    } catch {
      setLive((l) => ({ ...l, status: "ready", page: { enabled: true, items: [], nextPageToken: null, error: "upstream" } }));
    }
  };

  const filtersActive = hasActiveFilters(query);
  const filterCount = activeFilterCount(query) - (query.group ? 1 : 0) - query.categories.length;
  const showSkeleton = status === "loading";

  const resultSummary = useMemo(() => {
    if (status === "loading") return t("lib.searching");
    if (status === "error") return t("lib.unavailable");
    const results = plural(`count.${kind}`, total);
    return query.q ? t("lib.summary.query", { results, q: query.q }) : results;
  }, [status, total, kind, query.q, t, plural]);

  // Every active filter as a removable chip, so combined filters stay easy to read and undo.
  const chips = useMemo(() => {
    const out: { key: string; label: string; remove: () => SearchQuery }[] = [];
    const multi = <K extends MultiKey>(key: K, label: (v: SearchQuery[K][number]) => string) => {
      for (const v of query[key] as string[]) {
        out.push({
          key: `${key}:${v}`,
          label: label(v as SearchQuery[K][number]),
          remove: () => ({ ...query, [key]: (query[key] as string[]).filter((x) => x !== v) }),
        });
      }
    };
    if (query.group) out.push({ key: `group:${query.group}`, label: groupName(query.group), remove: () => ({ ...query, group: null }) });
    for (const c of query.categories) {
      out.push({ key: `cat:${c}`, label: cat(c), remove: () => ({ ...query, categories: query.categories.filter((x) => x !== c) }) });
    }
    multi("types", (v) => t(`ctype.${v}`));
    multi("media", (v) => t(`media.${v}`));
    multi("techniques", (v) => t(`tech.${v}`));
    multi("movements", (v) => t(`move.${v}`));
    multi("software", softwareLabel);
    multi("levels", (v) => t(`level.${v}`));
    multi("creators", (v) => counts.creators[v]?.name ?? v);
    if (query.duration !== "any") out.push({ key: "dur", label: t(`dur.${query.duration}`), remove: () => ({ ...query, duration: "any" }) });
    return out;
  }, [query, t, cat, groupName, softwareLabel, counts.creators]);

  const multiDropdown = <K extends MultiKey>(key: K, labelKey: MessageKey, opts: DropdownOption<string>[], extra?: { searchable?: boolean }) =>
    opts.length > 0 ? (
      <Dropdown
        key={key}
        label={t(labelKey)}
        multiple
        options={opts}
        value={query[key] as string[]}
        onChange={(v) => update({ [key]: v } as Partial<SearchQuery>)}
        searchable={extra?.searchable ? { placeholder: t("filter.creator.search"), empty: t("filter.creator.empty") } : undefined}
      />
    ) : null;

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="max-w-3xl">
        <SearchField
          id={`${kind}-search`}
          label={t(`lib.${kind}.label`)}
          placeholder={t(`lib.${kind}.placeholder`)}
          value={text}
          onValueChange={setText}
          busy={status === "loading"}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyQuery({ ...query, q: text.trim() });
            }
          }}
        />
      </form>

      <div className="mt-6">
        <FacetNav
          group={query.group}
          categories={query.categories}
          counts={counts.categories}
          groupCounts={counts.groups}
          onGroupChange={(group) => update({ group })}
          onCategoriesChange={(categories) => update({ categories })}
        />
      </div>

      <div className="mt-4 border-b border-line pb-4">
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={`${kind}-filters`}
            onClick={() => setFiltersOpen((o) => !o)}
            className={cx(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm",
              filterCount > 0 ? "border-accent/60 bg-accent-soft text-fg" : "border-line text-muted",
            )}
          >
            <Icon name="filter" size={16} />
            {t("filter.show")}
            {filterCount > 0 && <span className="tabular text-accent">{number(filterCount)}</span>}
            <Icon name="chevronDown" size={15} className={cx("transition-transform duration-200", filtersOpen && "rotate-180")} />
          </button>
          <div className="ml-auto">
            <SortDropdown value={query.sort} options={options.sort} onChange={(sort) => update({ sort })} label={t("filter.sort")} />
          </div>
        </div>

        <div
          id={`${kind}-filters`}
          className={cx("mt-3 flex-wrap items-center gap-2 sm:mt-0 sm:flex", filtersOpen ? "flex" : "hidden")}
        >
          {multiDropdown("types", "filter.type", options.types)}
          {multiDropdown("media", "filter.media", options.media)}
          {multiDropdown("techniques", "filter.technique", options.techniques)}
          {multiDropdown("movements", "filter.movement", options.movements)}
          {multiDropdown("software", "filter.software", options.software)}
          {multiDropdown("levels", "filter.level", options.levels)}
          <Dropdown
            label={t("filter.length")}
            icon="clock"
            options={options.duration}
            value={query.duration}
            defaultValue="any"
            onChange={(duration) => update({ duration })}
          />
          {multiDropdown("creators", "filter.creator", options.creators, { searchable: true })}
          <div className="ml-auto hidden sm:block">
            <SortDropdown value={query.sort} options={options.sort} onChange={(sort) => update({ sort })} label={t("filter.sort")} />
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label={t("filter.active")}>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => applyQuery(chip.remove())}
                aria-label={t("filter.removeOne", { label: chip.label })}
                className="ae-pop-in inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-2 py-0 pr-2 pl-3 text-[12.5px] text-fg ring-1 ring-line transition-colors duration-150 hover:ring-line-strong"
              >
                {chip.label}
                <Icon name="close" size={12} strokeWidth={2.2} className="text-subtle" />
              </button>
            ))}
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="ml-1 h-7 px-2 text-[12.5px] text-accent underline-offset-4 hover:underline">
                {t("filter.clear")}
              </button>
            )}
          </div>
        )}
      </div>

      {query.duration !== "any" && (
        <p className="ae-fade-in mt-3 flex items-center gap-2 text-[13px] text-subtle">
          <Icon name="info" size={15} />
          {t("lib.lengthNote")}
        </p>
      )}

      <div className="mt-6 flex items-baseline justify-between gap-4">
        <h2 key={resultSummary} className="ae-fade-in text-sm text-muted" aria-live="polite">
          {resultSummary}
        </h2>
      </div>

      <div className="mt-5">
        {status === "error" ? (
          <ErrorState message={error ? t(error.key, error.vars) : null} onRetry={retry} />
        ) : showSkeleton ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <EmptyState
            kind={kind}
            query={query}
            filtersActive={filtersActive}
            examples={list(`lib.${kind}.examples`)}
            onClearFilters={clearFilters}
            onClearAll={clearAll}
            onExample={(q) => {
              setText(q);
              applyQuery({ ...query, q });
            }}
          />
        ) : (
          <>
            <ResultsGrid items={items} />
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button type="button" onClick={loadMore} disabled={status === "loading-more"} className="ae-btn ae-btn-ghost h-11 px-6">
                  {status === "loading-more" && <span className="ae-spinner" aria-hidden="true" />}
                  {status === "loading-more" ? t("lib.loading") : t(`lib.${kind}.more`)}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {status !== "error" && status !== "loading" && (
        <LiveResults
          kind={liveKind}
          query={query.q}
          enabled={liveEnabled}
          state={live}
          onSearch={() => void runLive(null)}
          onMore={(token) => void runLive(token)}
        />
      )}
    </div>
  );
}

function SortDropdown({
  value,
  options,
  onChange,
  label,
}: {
  value: SearchQuery["sort"];
  options: DropdownOption<SearchQuery["sort"]>[];
  onChange: (v: SearchQuery["sort"]) => void;
  label: string;
}) {
  return <Dropdown label={label} icon="sort" align="right" showValue options={options} value={value} defaultValue="relevance" onChange={onChange} />;
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="ae-rise flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 sm:p-8">
      <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-danger">
        <Icon name="alert" size={20} />
      </span>
      <div>
        <p className="text-base font-medium text-fg">{t("lib.error.title")}</p>
        <p className="mt-1 max-w-[60ch] text-sm text-muted">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="ae-btn ae-btn-primary group">
        <Icon name="refresh" size={16} className="transition-transform duration-500 ease-soft group-hover:-rotate-180" />
        {t("lib.retry")}
      </button>
    </div>
  );
}

function EmptyState({
  kind,
  query,
  filtersActive,
  examples,
  onClearFilters,
  onClearAll,
  onExample,
}: {
  kind: LibraryScope;
  query: SearchQuery;
  filtersActive: boolean;
  examples: string[];
  onClearFilters: () => void;
  onClearAll: () => void;
  onExample: (q: string) => void;
}) {
  const { t } = useI18n();
  const title = query.q ? t(filtersActive ? `empty.${kind}.qf` : `empty.${kind}.q`, { q: query.q }) : t(`empty.${kind}.f`);
  return (
    <div className="ae-rise rounded-card border border-dashed border-line-strong p-6 sm:p-10">
      <p className="text-lg font-medium text-fg">{title}</p>
      <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted">{t(filtersActive ? "empty.hint.filters" : "empty.hint.plain")}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {filtersActive && (
          <button type="button" onClick={onClearFilters} className="ae-btn ae-btn-primary h-9 px-4">
            {t("filter.clear")}
          </button>
        )}
        {query.q && (
          <button type="button" onClick={onClearAll} className="ae-btn ae-btn-ghost h-9 px-4">
            {t("empty.clearSearch")}
          </button>
        )}
        <Link href="/categories" className="ae-btn ae-btn-quiet h-9 px-4">
          {t("empty.browse")}
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-subtle">{t("home.try")}</span>
        {examples.map((example, i) => (
          <button key={example} type="button" onClick={() => onExample(example)} className="ae-chip ae-pop-in" style={{ ["--i" as string]: i }}>
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
