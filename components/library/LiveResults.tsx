"use client";

import type { LiveSearchPage, Resource, ResourceKind } from "@/lib/types";
import { ResultsGrid, SkeletonGrid } from "@/components/library/ResultsGrid";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";

/**
 * Live results are fetched only when the user asks (they cost API quota) and are
 * shown in their own clearly labelled section — never mixed into the curated list.
 */
export function LiveResults({
  kind,
  query,
  enabled,
  state,
  onSearch,
  onMore,
}: {
  kind: ResourceKind;
  query: string;
  enabled: boolean;
  state: { status: "idle" | "loading" | "ready"; page: LiveSearchPage | null; items: Resource[] };
  onSearch: () => void;
  onMore: (token: string) => void;
}) {
  const { t } = useI18n();
  if (!enabled) {
    return (
      <p className="mt-12 flex items-start gap-2 border-t border-line pt-5 text-[13px] text-subtle">
        <Icon name="info" size={15} className="mt-px shrink-0" />
        {t("live.off")}
      </p>
    );
  }
  if (!query) return null;

  return (
    <section aria-labelledby="live-heading" className="mt-14 border-t border-line pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="live-heading" className="stretch-semi text-lg font-semibold text-fg">
            {t("live.title")}
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted">{t("live.desc")}</p>
        </div>
        {state.status === "idle" && (
          <button
            type="button"
            onClick={onSearch}
            className="ae-btn ae-btn-ghost"
          >
            <Icon name="search" size={16} />
            {t("live.search", { q: query })}
          </button>
        )}
      </div>

      <div className="mt-6" aria-live="polite">
        {state.status === "loading" && state.items.length === 0 && <SkeletonGrid count={4} />}
        {state.page?.error && <p className="text-sm text-muted">{t(`live.err.${state.page.error}`)}</p>}
        {state.status !== "idle" && !state.page?.error && state.items.length === 0 && state.status === "ready" && (
          <p className="text-sm text-muted">{t("live.none", { q: query })}</p>
        )}
        {state.items.length > 0 && <ResultsGrid items={state.items} />}
        {state.page?.nextPageToken && state.items.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={state.status === "loading"}
              onClick={() => state.page?.nextPageToken && onMore(state.page.nextPageToken)}
              className="ae-btn ae-btn-ghost"
            >
              {state.status === "loading" ? t("lib.loading") : t("live.more")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
